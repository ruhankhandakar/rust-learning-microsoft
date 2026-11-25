// Usage: pnpm exec tsx scripts/check-rust-blocks.ts [work-dir]
// Type-checks (never runs) every Rust block in the Microsoft books with the local rustc and writes
// data/rust-blocks.json: the blocks that compile as-is ("main") or wrapped in fn main ("wrap").
import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { BOOKS } from "../lib/books";
import { getBookStructure, getChapterMarkdown } from "../lib/content";
import { extractRustBlocks, hashCode } from "../lib/rust-blocks";
import { hasMain, wrapInMain } from "../lib/rust-wrap";

type Mode = "main" | "wrap";
interface Block {
  code: string;
  mode: Mode;
  where: string;
  error?: string;
}

const execFileAsync = promisify(execFile);
const workDir = path.resolve(process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), "rust-blocks-")));
fs.mkdirSync(workDir, { recursive: true });

const blocks = new Map<string, Block>();
let total = 0;
for (const book of BOOKS) {
  if (book.slug === "100-rust-projects") continue;
  for (const ch of getBookStructure(book.dirName).flatChapters) {
    for (const { code } of extractRustBlocks(getChapterMarkdown(book.dirName, ch.slug))) {
      total++;
      const hash = hashCode(code);
      const seen = blocks.get(hash);
      if (seen && seen.code.trimEnd() !== code.trimEnd()) throw new Error(`hash collision on ${hash}`);
      if (!seen) blocks.set(hash, { code, mode: hasMain(code) ? "main" : "wrap", where: `${book.slug}/${ch.slug}` });
    }
  }
}

async function compile(hash: string, block: Block, emit: "metadata" | "link"): Promise<string | undefined> {
  const src = path.join(workDir, `${hash}.rs`);
  fs.writeFileSync(src, block.mode === "wrap" ? wrapInMain(block.code) : block.code);
  const out = path.join(workDir, `${hash}.${emit === "link" ? "bin" : "rmeta"}`);
  try {
    await execFileAsync(
      "rustc",
      ["--edition", "2024", "--crate-type", "bin", "--crate-name", "playground", `--emit=${emit}`, "-A", "warnings", "-o", out, src],
      { timeout: 60_000, maxBuffer: 16 << 20 }
    );
  } catch (e) {
    const err = e as { stderr?: string; killed?: boolean };
    return err.killed ? "timeout" : err.stderr || String(e);
  }
}

async function eachLimited<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => { while (next < items.length) await fn(items[next++]); }));
}

async function main() {
  const rustc = (await execFileAsync("rustc", ["--version"])).stdout.trim();
  const limit = Math.min(8, os.availableParallelism());
  await eachLimited([...blocks], limit, async ([hash, block]) => {
    block.error = await compile(hash, block, "metadata");
  });

  // --emit=metadata never links, so foreign items that only fail at link time would slip through.
  const FOREIGN = /\bextern\s+(?:"[^"]*"\s*)?\{|#\[(?:unsafe\()?link\b/;
  const linkChecked = [...blocks].filter(([, b]) => !b.error && FOREIGN.test(b.code));
  await eachLimited(linkChecked, limit, async ([hash, block]) => {
    block.error = await compile(hash, block, "link");
  });

  const runnable = Object.fromEntries(
    [...blocks].filter(([, b]) => !b.error).sort(([a], [b]) => (a < b ? -1 : 1)).map(([hash, b]) => [hash, b.mode])
  );
  const dataFile = path.join(process.cwd(), "data", "rust-blocks.json");
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify({ rustc, edition: "2024", blocks: runnable }, null, 2) + "\n");

  // rustc calls any unknown path root an "unlinked crate"; it is a std module when rustc suggests `use std::...::name;`.
  const externalCrates = (error: string) =>
    [...error.matchAll(/unlinked crate `(\w+)`|can't find crate for `(\w+)`/g)]
      .map((m) => m[1] ?? m[2])
      .filter((name) => !new RegExp(`\\+ use (?:std|core|alloc)::(?:\\w+::)*${name};`).test(error));
  const firstError = (error: string) => error.split("\n").find((l) => l.startsWith("error")) ?? error.split("\n")[0];
  const tally = (names: string[]) => {
    const counts = new Map<string, number>();
    for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([n, c]) => `${n} ${c}`).join(", ");
  };
  const errorCodes = (list: Block[]) => tally(list.map((b) => firstError(b.error!).match(/^error\[(E\d+)\]/)?.[1] ?? firstError(b.error!).slice(0, 60)));

  const failed = [...blocks.values()].filter((b) => b.error);
  const external = failed.filter((b) => externalCrates(b.error!).length);
  const fragments = failed.filter((b) => b.mode === "wrap" && !external.includes(b));
  const brokenMains = failed.filter((b) => b.mode === "main" && !external.includes(b));
  const count = (mode: Mode, list: Block[]) => list.filter((b) => b.mode === mode).length;
  const passed = [...blocks.values()].filter((b) => !b.error);

  const mainFailuresFile = path.join(workDir, "fn-main-failures.txt");
  fs.writeFileSync(
    mainFailuresFile,
    brokenMains.map((b) => `## ${b.where}\n${firstError(b.error!)}\n\n${b.code}\n`).join("\n")
  );

  console.log(`${rustc}, edition 2024, ${limit} parallel compiles`);
  console.log(`Rust blocks: ${total} (${blocks.size} unique)`);
  console.log(`Compiled as-is (main): ${count("main", passed)}`);
  console.log(`Compiled wrapped (wrap): ${count("wrap", passed)}`);
  console.log(`Foreign-item blocks re-checked with a full link: ${linkChecked.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`  external crate imports: ${external.length} (fn main ${count("main", external)}, fragments ${count("wrap", external)})`);
  console.log(`    crates: ${tally(external.flatMap((b) => [...new Set(externalCrates(b.error!))]))}`);
  console.log(`  fragments missing earlier context: ${fragments.length}`);
  console.log(`    first errors: ${errorCodes(fragments)}`);
  console.log(`  fn main blocks with errors, no external crate: ${brokenMains.length} -> ${mainFailuresFile}`);
  console.log(`    first errors: ${errorCodes(brokenMains)}`);
  console.log(`Wrote ${path.relative(process.cwd(), dataFile)} (${Object.keys(runnable).length} blocks)`);
}

main();
