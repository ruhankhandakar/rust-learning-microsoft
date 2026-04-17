#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Reads content/100-rust-projects/progress.md + _project_dirs.json,
 * resolves note slugs and project dirs, writes manifest.json + SUMMARY.md
 */
const fs = require("fs");
const path = require("path");

const CONTENT_DIR = path.join(process.cwd(), "content", "100-rust-projects");
const PROGRESS_PATH = path.join(CONTENT_DIR, "progress.md");
const PROJECT_DIRS_PATH = path.join(CONTENT_DIR, "_project_dirs.json");
const MANIFEST_PATH = path.join(CONTENT_DIR, "manifest.json");
const SUMMARY_PATH = path.join(CONTENT_DIR, "SUMMARY.md");

function readMdSlugs() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && !["SUMMARY.md", "progress.md"].includes(f))
    .map((f) => f.replace(/\.md$/, ""));
}

function normalizeDir(s) {
  return s.replace(/\/$/, "").trim();
}

function extractProjectDir(cell) {
  const m = cell.match(/projects\/([^)\s"'<>]+)/i);
  if (!m) return null;
  return normalizeDir(m[1]);
}

function extractNoteFile(cell) {
  const m = cell.match(/notes\/([^)]+\.md)/i);
  if (!m) return null;
  return path.basename(m[1]);
}

function slugFromNoteFile(noteFile) {
  if (!noteFile) return null;
  return noteFile.replace(/\.md$/i, "");
}

function resolveProjectDir(requested, projectDirs, chapterSlug, title) {
  const set = new Set(projectDirs);
  if (requested && set.has(requested)) return requested;

  const candidates = new Set();
  if (requested) {
    candidates.add(requested);
    candidates.add(requested.replace(/-/g, "_"));
    candidates.add(requested.replace(/_/g, "-"));
  }
  if (chapterSlug) {
    candidates.add(chapterSlug);
    candidates.add(chapterSlug.replace(/-/g, "_"));
  }

  for (const c of candidates) {
    if (c && set.has(c)) return c;
  }

  const slugLo = (chapterSlug || "").toLowerCase();
  const tLo = (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  let best = null;
  let bestScore = 0;
  for (const d of projectDirs) {
    const dLo = d.toLowerCase().replace(/-/g, "_");
    let score = 0;
    if (slugLo && (dLo === slugLo || dLo.includes(slugLo) || slugLo.includes(dLo)))
      score += 3;
    if (tLo.length > 4 && dLo.includes(tLo.slice(0, 8))) score += 2;
    if (requested && dLo.includes(requested.toLowerCase().replace(/-/g, "_")))
      score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return bestScore > 0 ? best : requested && set.has(requested) ? requested : null;
}

function resolveChapterSlug(slugFromNotes, mdSlugs, title, day) {
  if (slugFromNotes && mdSlugs.includes(slugFromNotes)) return slugFromNotes;

  const titleWords = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let best = null;
  let bestScore = 0;
  for (const s of mdSlugs) {
    const slo = s.toLowerCase();
    let score = 0;
    for (const w of titleWords) {
      if (slo.includes(w)) score += 1;
    }
    if (slo.includes(String(day).padStart(3, "0"))) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (bestScore >= 2) return best;
  return slugFromNotes && mdSlugs.includes(slugFromNotes) ? slugFromNotes : null;
}

function parseProgressTable(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  for (const line of lines) {
    const t = line.trim();
    if (!/^\|\s*\d{1,3}\s*\|/.test(t)) continue;
    if (/^\|\s*-+\s*\|/.test(t)) continue;
    const cells = t.split("|").map((c) => c.trim());
    if (cells.length < 9) continue;
    const day = parseInt(cells[1], 10);
    if (Number.isNaN(day)) continue;
    const title = cells[3];
    const typeLabel = cells[4];
    const status = cells[5];
    const projectCell = cells[6];
    const notesCell = cells[7];
    rows.push({ day, title, typeLabel, status, projectCell, notesCell });
  }
  return rows;
}

function main() {
  if (!fs.existsSync(PROGRESS_PATH)) {
    console.error("Missing", PROGRESS_PATH, "— run scripts/sync-100-rust-projects.sh first");
    process.exit(1);
  }

  const progressMd = fs.readFileSync(PROGRESS_PATH, "utf-8");
  let projectDirs = [];
  if (fs.existsSync(PROJECT_DIRS_PATH)) {
    projectDirs = JSON.parse(fs.readFileSync(PROJECT_DIRS_PATH, "utf-8"));
  }

  const mdSlugs = readMdSlugs();
  const tableRows = parseProgressTable(progressMd);

  const projects = [];
  const usedSlugs = new Set();

  for (const r of tableRows) {
    const requestedProj = extractProjectDir(r.projectCell);
    const noteFile = extractNoteFile(r.notesCell);
    let chapterSlug = slugFromNoteFile(noteFile);
    chapterSlug = resolveChapterSlug(chapterSlug, mdSlugs, r.title, r.day);

    if (!chapterSlug || !mdSlugs.includes(chapterSlug)) {
      console.warn(
        `WARN day ${r.day}: no note file for "${r.title}" (wanted slug ${chapterSlug || "?"})`
      );
      continue;
    }

    const projectDir = resolveProjectDir(
      requestedProj,
      projectDirs,
      chapterSlug,
      r.title
    );

    if (usedSlugs.has(chapterSlug)) {
      console.warn(`WARN duplicate slug ${chapterSlug} (day ${r.day})`);
      continue;
    }
    usedSlugs.add(chapterSlug);

    projects.push({
      day: r.day,
      title: r.title,
      typeLabel: r.typeLabel,
      status: r.status,
      chapterSlug,
      noteFile: `${chapterSlug}.md`,
      projectDir,
    });
  }

  projects.sort((a, b) => a.day - b.day);

  const manifest = {
    upstreamRepo: "emmaglorypraise/100rustprojects",
    generatedAt: new Date().toISOString(),
    projects,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const summaryLines = [
    "# Summary",
    "",
    "[Glossary](glossary.md)",
    "",
    "# Projects",
    "",
  ];

  for (const p of projects) {
    const label = `${String(p.day).padStart(3, "0")} — ${p.title.replace(/\]/g, "］")}`;
    summaryLines.push(`- [${label}](${p.chapterSlug}.md)`);
  }

  summaryLines.push("");
  fs.writeFileSync(SUMMARY_PATH, summaryLines.join("\n"));

  console.log(
    "Wrote manifest:",
    projects.length,
    "projects,",
    "SUMMARY.md entries:",
    projects.length + 1,
    "(+ glossary intro)"
  );
}

main();
