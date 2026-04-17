import fs from "fs";
import path from "path";

const CONTENT_SUBDIR = path.join("content", "100-rust-projects");
const PROJECTS_ROOT = path.join(process.cwd(), CONTENT_SUBDIR, "projects");

export interface SourceListingEntry {
  name: string;
  kind: "dir" | "file";
  size: number | null;
}

function normalizeSegments(segments: string[] | undefined): string[] {
  if (!segments?.length) return [];
  const out: string[] = [];
  for (const s of segments) {
    if (s === "" || s === "." || s === "..") return [];
    out.push(s);
  }
  return out;
}

/** Resolve and validate path under projects/<projectDir>/; returns null if invalid or missing. */
export function resolveProjectSourcePath(
  projectDir: string,
  segments: string[] | undefined
): { absolute: string; relative: string } | null {
  if (
    !projectDir ||
    projectDir.includes("..") ||
    /[\\/]/.test(projectDir)
  ) {
    return null;
  }
  const root = path.join(PROJECTS_ROOT, projectDir);
  const resolvedRoot = path.resolve(root);
  if (!resolvedRoot.startsWith(path.resolve(PROJECTS_ROOT))) return null;
  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    return null;
  }

  const parts = normalizeSegments(segments);
  if (parts.length === 0) {
    return { absolute: resolvedRoot, relative: "" };
  }

  const target = path.resolve(resolvedRoot, ...parts);
  if (!target.startsWith(resolvedRoot + path.sep) && target !== resolvedRoot) {
    return null;
  }
  if (!fs.existsSync(target)) return null;

  return {
    absolute: target,
    relative: path.relative(resolvedRoot, target).split(path.sep).join("/"),
  };
}

export function listProjectSourceDir(absDir: string): SourceListingEntry[] {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const rows: SourceListingEntry[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(absDir, e.name);
    const st = fs.statSync(full);
    if (e.isDirectory()) {
      rows.push({ name: e.name, kind: "dir", size: null });
    } else if (e.isFile()) {
      rows.push({ name: e.name, kind: "file", size: st.size });
    }
  }
  rows.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return rows;
}

const MAX_FILE_BYTES = 512 * 1024;

export function readProjectSourceFile(
  absFile: string
): { kind: "text"; content: string } | { kind: "binary" } | { kind: "large" } {
  const st = fs.statSync(absFile);
  if (!st.isFile()) return { kind: "binary" };
  if (st.size > MAX_FILE_BYTES) return { kind: "large" };

  const buf = fs.readFileSync(absFile);
  if (buf.includes(0)) return { kind: "binary" };

  try {
    const content = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return { kind: "text", content };
  } catch {
    return { kind: "binary" };
  }
}
