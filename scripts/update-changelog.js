/* eslint-disable @typescript-eslint/no-require-imports */
// Usage: node scripts/update-changelog.js            -> upsert today's (UTC) entry from uncommitted content/ changes
//        node scripts/update-changelog.js --backfill -> rebuild data/changelog.json from the sync commits in git history
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "changelog.json");
const SYNC_SUBJECT = /^chore: sync (upstream book )?content/i;
const CHAPTER_FILE = /^content\/([^/]+)\/([^/]+\.md)$/;
const NOISE = new Set(["progress.md"]);

function git(args) {
  return execFileSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 256 << 20,
    env: { ...process.env, TZ: "UTC" },
  });
}

// Parses `--numstat --summary` output into rows; status comes from the summary's create/delete lines.
function parseDiff(text) {
  const rows = new Map();
  const statuses = new Map();
  for (const line of text.split("\n")) {
    const num = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (num) rows.set(num[3], { path: num[3], added: Number(num[1]) || 0, removed: Number(num[2]) || 0, status: "modified" });
    const summary = line.match(/^ (create|delete) mode \d+ (.+)$/);
    if (summary) statuses.set(summary[2], summary[1] === "create" ? "added" : "deleted");
  }
  for (const [p, status] of statuses) if (rows.has(p)) rows.get(p).status = status;
  return [...rows.values()];
}

// Folds a later row for the same path into an earlier one (same-day commits).
function combine(prev, cur) {
  if (prev.status === "added" && cur.status === "deleted") return null;
  const status = prev.status === "added" ? "added" : cur.status === "deleted" ? "deleted" : "modified";
  return { ...cur, added: prev.added + cur.added, removed: prev.removed + cur.removed, status };
}

function toEntry(date, rows) {
  const books = new Map();
  for (const row of rows) {
    const m = row.path.match(CHAPTER_FILE);
    if (!m || NOISE.has(m[2])) continue;
    const book = books.get(m[1]) ?? { dir: m[1], files: [] };
    books.set(m[1], book);
    if (m[2] === "SUMMARY.md") book.toc = true;
    else book.files.push({ file: m[2], added: row.added, removed: row.removed, status: row.status });
  }
  const sorted = [...books.values()]
    .filter((b) => b.toc || b.files.length)
    .sort((a, b) => a.dir.localeCompare(b.dir))
    .map((b) => ({ dir: b.dir, ...(b.toc && { toc: true }), files: b.files.sort((x, y) => x.file.localeCompare(y.file)) }));
  return sorted.length ? { date, books: sorted } : null;
}

function backfill() {
  const log = git(["log", "--no-renames", "--numstat", "--summary", "--date=format-local:%Y-%m-%d", "--format=%x01%cd%x09%s", "--", "content/"]);
  const byDate = new Map();
  for (const chunk of log.split("\x01").filter(Boolean).reverse()) {
    const [header, ...rest] = chunk.split("\n");
    const [date, subject] = header.split("\t");
    if (!SYNC_SUBJECT.test(subject)) continue;
    const day = byDate.get(date) ?? new Map();
    byDate.set(date, day);
    for (const row of parseDiff(rest.join("\n"))) {
      const merged = day.has(row.path) ? combine(day.get(row.path), row) : row;
      if (merged) day.set(row.path, merged);
      else day.delete(row.path);
    }
  }
  return [...byDate].map(([date, day]) => toEntry(date, day.values())).filter(Boolean);
}

function countLines(file) {
  const text = fs.readFileSync(path.join(ROOT, file), "utf-8");
  return text ? text.split("\n").length - (text.endsWith("\n") ? 1 : 0) : 0;
}

function entryRows(entry) {
  return (entry?.books ?? []).flatMap((b) => [
    ...(b.toc ? [{ path: `content/${b.dir}/SUMMARY.md`, added: 0, removed: 0, status: "modified" }] : []),
    ...b.files.map((f) => ({ path: `content/${b.dir}/${f.file}`, added: f.added, removed: f.removed, status: f.status })),
  ]);
}

// Starts from the committed changelog so re-running before a commit gives the same result.
function committedEntries() {
  try {
    return JSON.parse(execFileSync("git", ["show", "HEAD:data/changelog.json"], { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    return fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf-8")) : [];
  }
}

function today() {
  const rows = parseDiff(git(["diff", "--no-renames", "--numstat", "--summary", "HEAD", "--", "content/"]));
  for (const file of git(["ls-files", "--others", "--exclude-standard", "--", "content/"]).split("\n")) {
    if (CHAPTER_FILE.test(file)) rows.push({ path: file, added: countLines(file), removed: 0, status: "added" });
  }
  const date = new Date().toISOString().slice(0, 10);
  const existing = committedEntries();
  // A second run on the same UTC day (after the first sync was merged) adds to that day's entry.
  const day = new Map();
  for (const row of [...entryRows(existing.find((e) => e.date === date)), ...rows]) {
    const merged = day.has(row.path) ? combine(day.get(row.path), row) : row;
    if (merged) day.set(row.path, merged);
    else day.delete(row.path);
  }
  return [...existing.filter((e) => e.date !== date), toEntry(date, day.values())].filter(Boolean);
}

const entries = (process.argv.includes("--backfill") ? backfill() : today()).sort((a, b) => b.date.localeCompare(a.date));
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(entries, null, 2) + "\n");
const files = entries.reduce((n, e) => n + e.books.reduce((m, b) => m + b.files.length, 0), 0);
console.log(`changelog.json: ${entries.length} entries, ${files} file changes${entries[0] ? `, newest ${entries[0].date}` : ""}`);
