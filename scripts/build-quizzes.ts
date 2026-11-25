// Usage: pnpm exec tsx scripts/build-quizzes.ts — needs a local rustc; writes data/quizzes.json.
// Only type-checks (rustc --emit=metadata); nothing it compiles is ever executed. Scratch files go under $QUIZ_TMPDIR (default: OS temp dir).
import { execFile, execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { BOOKS } from "../lib/books";
import { getBookStructure, getChapterMarkdown } from "../lib/content";
import { extractRustBlocks, hashCode } from "../lib/rust-blocks";
import type { QuizQuestion } from "../lib/quizzes";

const MAX_LINES = 40;
const PER_CHAPTER = 4;
const TIMEOUT_MS = 30_000;
const KEEP_CODES = new Set([
  "E0373", "E0381", "E0382", "E0384", "E0499", "E0502", "E0503", "E0505", "E0506",
  "E0507", "E0515", "E0594", "E0596", "E0597", "E0716", "E0308",
]);

interface Diagnostic {
  code?: string;
  message: string;
  label?: string;
  line?: number;
}
interface Span {
  file_name: string;
  line_start: number;
  is_primary: boolean;
  label: string | null;
  expansion?: { span: Span };
}
type Outcome = { compiles: true } | { compiles: false; errors: Diagnostic[] };

const tmp = fs.mkdtempSync(path.join(process.env.QUIZ_TMPDIR ?? os.tmpdir(), "rust-quizzes-"));

function compile(code: string, slot: number): Promise<Outcome | null> {
  const src = path.join(tmp, `w${slot}.rs`);
  fs.writeFileSync(src, code);
  const args = [
    "--edition=2024", "--crate-type=bin", "--crate-name=q", "-A", "warnings", "--error-format=json",
    `--emit=metadata=${path.join(tmp, `w${slot}.rmeta`)}`, src,
  ];
  return new Promise((resolve) => {
    execFile("rustc", args, { cwd: tmp, timeout: TIMEOUT_MS, maxBuffer: 64 << 20 }, (err, _out, stderr) => {
      if (!err) return resolve({ compiles: true });
      // Exit 1 is an ordinary compile error; timeouts, signals and ICEs (101) are not answers.
      if (err.code !== 1) return resolve(null);
      const errors = stderr.split("\n").flatMap((line): Diagnostic[] => {
        try {
          const d = JSON.parse(line);
          if (d.level !== "error" || /^aborting due to/.test(d.message)) return [];
          let span: Span | undefined = d.spans?.find((s: Span) => s.is_primary);
          // Errors inside macros (println!, assert_eq!) point into std; walk back to the call site.
          while (span && span.file_name !== src) span = span.expansion?.span;
          return [{ code: d.code?.code, message: d.message, label: span?.label ?? undefined, line: span?.line_start }];
        } catch {
          return [];
        }
      });
      resolve(errors.length ? { compiles: false, errors } : null);
    });
  });
}

async function compileAll(codes: string[]): Promise<(Outcome | null)[]> {
  const results: (Outcome | null)[] = new Array(codes.length);
  let next = 0;
  const workers = Math.min(8, os.availableParallelism());
  await Promise.all(
    Array.from({ length: workers }, async (_, slot) => {
      while (next < codes.length) {
        const i = next++;
        results[i] = await compile(codes[i], slot);
      }
    })
  );
  return results;
}

const LITERAL =
  /\/\/[^\n]*|\/\*[\s\S]*?\*\/|\bb?r(#*)"[\s\S]*?"\1|b?"(?:\\[\s\S]|[^"\\])*"|b?'(?:\\u\{[\da-fA-F]+\}|\\.|[^'\\\n])'/g;

/** Blanks comments and string/char literals (same length) so patterns only match real code. */
function scan(code: string) {
  const commentLines = new Set<number>();
  const masked = code.replace(LITERAL, (m: string, _hashes: string, offset: number) => {
    if (m.startsWith("/")) {
      const first = code.slice(0, offset).split("\n").length - 1;
      for (let i = 0; i <= m.split("\n").length - 1; i++) commentLines.add(first + i);
    }
    return m.replace(/[^\n]/g, " ");
  });
  return { masked: masked.split("\n"), commentLines };
}

interface ReplaceOp {
  name: string;
  re: RegExp;
  edit: (m: RegExpMatchArray) => [replacement: string, change: string];
}

const REPLACE_OPS: ReplaceOp[] = [
  { name: "clone", re: /\.clone\(\)/g, edit: () => ["", "Removed `.clone()`"] },
  { name: "to-owned", re: /\.(?:to_string|to_owned)\(\)/g, edit: (m) => ["", `Removed \`${m[0]}\``] },
  {
    name: "let-mut",
    re: /\blet\s+mut\s+([A-Za-z_]\w*)/g,
    edit: (m) => [`let ${m[1]}`, `Changed \`let mut ${m[1]}\` to \`let ${m[1]}\``],
  },
  {
    name: "mut-ref",
    re: /&mut\s+([A-Za-z_][\w.]*)/g,
    edit: (m) => [`&${m[1]}`, `Changed \`&mut ${m[1]}\` to \`&${m[1]}\``],
  },
  {
    name: "remove-ref",
    re: /(?<=[(,]\s*|[^=!<>]=\s*|\bin\s+)&(?:mut\s+)?([A-Za-z_][\w.]*)(?=\s*[,){;])/g,
    edit: (m) => [m[1], `Changed \`${m[0]}\` to \`${m[1]}\``],
  },
  { name: "move", re: /\bmove\s*(?=\|)/g, edit: () => ["", "Removed `move` from the closure"] },
];

const BARE_ARG = /[(,]\s*(?!true\b|false\b)[a-z_]\w*\s*[,)]/;
const LET_MOVE = /^\s*let\s+(?:mut\s+)?\w+\s*(?::[^=]+)?=\s*[a-z_]\w*\s*;\s*$/;
const count = (s: string, c: string) => s.split(c).length - 1;

/** A one-line statement that moves or passes a plain variable; repeating it tests use-after-move. */
function isRepeatable(masked: string): boolean {
  const t = masked.trim();
  if (!t.endsWith(";") || /^(return|break|continue)\b/.test(t) || /!\s*[([{]/.test(t)) return false;
  if (count(t, "(") !== count(t, ")") || count(t, "{") !== count(t, "}") || count(t, "[") !== count(t, "]"))
    return false;
  return LET_MOVE.test(t) || BARE_ARG.test(t.replace(/^let\s[^=]*=/, ""));
}

interface Mutant {
  op: string;
  code: string;
  changedLine: number;
  change: string;
  original?: string;
}

const LET_BORROW = /^(\s*)let\s+(?:mut\s+)?(\w+)\s*(?::[^=]+)?=\s*&(?:mut\s+)?([a-z_]\w*)\b[^;]*;$/;

function mutate(code: string): Mutant[] {
  const lines = code.split("\n");
  const { masked, commentLines } = scan(code);
  const out: Mutant[] = [];
  const replaceLine = (i: number, line: string) => [...lines.slice(0, i), line, ...lines.slice(i + 1)].join("\n");
  const insertAfter = (i: number, line: string) => [...lines.slice(0, i + 1), line, ...lines.slice(i + 1)].join("\n");
  masked.forEach((m, i) => {
    const end = m.trimEnd().length;
    if (!end || (commentLines.has(i) && !/^\/[/*]/.test(lines[i].slice(end).trimStart()))) return;
    // The edited line loses its trailing comment, which described the original code.
    const base = commentLines.has(i) ? lines[i].slice(0, end) : lines[i];
    const n = i + 1;
    for (const op of REPLACE_OPS) {
      const hits = [...m.matchAll(op.re)];
      if (hits.length !== 1) continue;
      const [hit] = hits;
      const [replacement, change] = op.edit(hit);
      const line = base.slice(0, hit.index) + replacement + base.slice(hit.index! + hit[0].length);
      out.push({ op: op.name, code: replaceLine(i, line), changedLine: n, change: `${change} on line ${n}`, original: lines[i] });
    }
    if (isRepeatable(m)) {
      out.push({ op: "repeat", code: insertAfter(i, base), changedLine: n + 1, change: `Repeated line ${n} as line ${n + 1}` });
    }
    const borrow = m.trimEnd().match(LET_BORROW);
    const declared = borrow && new RegExp(`\\blet\\s+(?:mut\\s+)?${borrow[3]}\\b|[(,]\\s*(?:mut\\s+)?${borrow[3]}\\s*:`);
    if (borrow && declared!.test(masked.slice(0, i).join("\n"))) {
      const [, indent, name, target] = borrow;
      for (const [op, added] of [["borrow-mut", `let ${name}2 = &mut ${target};`], ["borrow-drop", `drop(${target});`]]) {
        out.push({ op, code: insertAfter(i, indent + added), changedLine: n + 1, change: `Added \`${added}\` as line ${n + 1}` });
      }
    }
  });
  return out;
}

interface Block {
  bookSlug: string;
  chapterSlug: string;
  index: number;
  code: string;
}

type StoredQuestion = Omit<QuizQuestion, "rustc">;
interface Candidate {
  q: StoredQuestion;
  op: string;
  blockIndex: number;
  lines: number;
}

function pick(cands: Candidate[]): Candidate[] {
  const picked: Candidate[] = [];
  const uses = (key: (c: Candidate) => string | undefined, c: Candidate) =>
    picked.filter((p) => key(p) === key(c)).length;
  const rank = (c: Candidate) => [
    uses((x) => String(x.blockIndex), c),
    c.q.errorCode === "E0308" ? 1 : 0,
    uses((x) => x.op, c),
    c.q.compiles ? 0 : uses((x) => x.q.errorCode, c),
    c.lines,
  ];
  let rest = [...cands];
  while (picked.length < PER_CHAPTER) {
    const passes = picked.filter((c) => c.q.compiles).length;
    const compiling = rest.filter((c) => c.q.compiles);
    // Keep "doesn't compile" from dominating, or always answering it would be a winning strategy.
    const failing = picked.length - passes < passes + 1 ? rest.filter((c) => !c.q.compiles) : [];
    const [first, second] = picked.length % 2 ? [compiling, failing] : [failing, compiling];
    const pool = first.length ? first : second;
    if (!pool.length) break;
    const best = pool.reduce((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] < rb[i] ? a : b;
      return a.q.id <= b.q.id ? a : b;
    });
    picked.push(best);
    const same = (c: Candidate) => c.q.change === best.q.change && c.q.errorCode === best.q.errorCode;
    rest = rest.filter((c) => !same(c));
  }
  return picked.sort((a, b) => a.blockIndex - b.blockIndex || a.q.changedLine - b.q.changedLine || (a.q.id < b.q.id ? -1 : 1));
}

const EXTERNAL = /module or crate|unlinked crate|can't find crate|unresolved import `\w+`$/;

async function main() {
  const rustc = execFileSync("rustc", ["--version"], { encoding: "utf-8" }).match(/rustc (\S+)/)![1];
  const seen = new Set<string>();
  const blocks: Block[] = [];
  let considered = 0;
  let hiddenLines = 0;
  let duplicates = 0;
  for (const book of BOOKS) {
    if (book.slug === "100-rust-projects") continue;
    for (const ch of getBookStructure(book.dirName).flatChapters) {
      extractRustBlocks(getChapterMarkdown(book.dirName, ch.slug)).forEach((b, index) => {
        if (!/\bfn main\s*\(/.test(b.code) || b.flags.includes("ignore") || b.flags.includes("compile_fail")) return;
        considered++;
        if (/^\s*#(\s|$)/m.test(b.code)) return void hiddenLines++;
        if (seen.has(b.code)) return void duplicates++;
        seen.add(b.code);
        blocks.push({ bookSlug: book.slug, chapterSlug: ch.slug, index, code: b.code });
      });
    }
  }

  const originals = await compileAll(blocks.map((b) => b.code));
  const failures = { stdOnly: [] as object[], externalCrate: [] as object[] };
  const good: Block[] = [];
  blocks.forEach((b, i) => {
    const r = originals[i];
    if (r?.compiles) return void good.push(b);
    const errors = r ? r.errors : [{ message: "timeout or compiler crash" }];
    const entry = { bookSlug: b.bookSlug, chapterSlug: b.chapterSlug, blockIndex: b.index, errors: errors.slice(0, 3), code: b.code };
    (errors.some((e) => EXTERNAL.test(e.message)) ? failures.externalCrate : failures.stdOnly).push(entry);
  });
  const failuresPath = path.join(tmp, "original-failures.json");
  fs.writeFileSync(failuresPath, JSON.stringify(failures, null, 2));

  const mutants = good
    .filter((b) => b.code.split("\n").length <= MAX_LINES)
    .flatMap((b) => mutate(b.code).map((m) => ({ ...m, block: b })));
  const results = await compileAll(mutants.map((m) => m.code));

  const byChapter = new Map<string, Candidate[]>();
  const dropped: Record<string, number> = {};
  let discarded = 0;
  mutants.forEach((m, i) => {
    const r = results[i];
    if (!r) return void discarded++;
    const first = r.compiles ? undefined : r.errors[0];
    if (first && !KEEP_CODES.has(first.code ?? "")) {
      dropped[first.code ?? "no code"] = (dropped[first.code ?? "no code"] ?? 0) + 1;
      return;
    }
    const { block } = m;
    const key = `${block.bookSlug}/${block.chapterSlug}`;
    const q: StoredQuestion = {
      id: hashCode(`${block.code}\n${m.change}`),
      bookSlug: block.bookSlug,
      chapterSlug: block.chapterSlug,
      code: m.code,
      changedLine: m.changedLine,
      change: m.change,
      ...(m.original !== undefined && { original: m.original }),
      compiles: r.compiles,
      ...(first && { errorCode: first.code, errorMessage: first.message, errorLabel: first.label, errorLine: first.line }),
    };
    const cand: Candidate = { q, op: m.op, blockIndex: block.index, lines: m.code.split("\n").length };
    byChapter.set(key, [...(byChapter.get(key) ?? []), cand]);
  });

  const questions = [...byChapter.values()].flatMap(pick).map((c) => c.q);
  const ids = new Set(questions.map((q) => q.id));
  if (ids.size !== questions.length) throw new Error("duplicate quiz ids");

  const outFile = path.join(process.cwd(), "data", "quizzes.json");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const json = JSON.stringify({ rustc, edition: "2024", questions }) + "\n";
  fs.writeFileSync(outFile, json);

  const kept = [...byChapter.values()].flat().map((c) => c.q);
  const tally = (list: { compiles: boolean; errorCode?: string }[]) =>
    list.reduce<Record<string, number>>((acc, q) => {
      const k = q.compiles ? "compiles" : q.errorCode!;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  console.log(`rustc ${rustc}, edition 2024`);
  console.log(`blocks considered: ${considered} (skipped ${hiddenLines} with hidden lines, ${duplicates} duplicates)`);
  console.log(`originals compiled: ${good.length}/${blocks.length} (failures: ${failures.stdOnly.length} std-only, ${failures.externalCrate.length} external crate) -> ${failuresPath}`);
  console.log(`mutants tried: ${mutants.length}, kept: ${kept.length}, dropped: ${mutants.length - kept.length - discarded}, discarded (timeout/crash): ${discarded}`);
  console.log("kept by outcome:", tally(kept));
  console.log("dropped by first error:", dropped);
  console.log(`selected: ${questions.length} questions in ${byChapter.size} chapters`, tally(questions));
  console.log(`wrote ${path.relative(process.cwd(), outFile)} (${(Buffer.byteLength(json) / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
