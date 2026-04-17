import fs from "fs";
import path from "path";
import type { Rust100Manifest, Rust100ProjectEntry } from "./rust-100-projects-types";

export type { Rust100Manifest, Rust100ProjectEntry };

const CONTENT_SUBDIR = path.join("content", "100-rust-projects");

export function loadRust100Manifest(): Rust100Manifest {
  const p = path.join(process.cwd(), CONTENT_SUBDIR, "manifest.json");
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as Rust100Manifest;
}

export function getRust100ProjectByChapterSlug(
  manifest: Rust100Manifest,
  chapterSlug: string
): Rust100ProjectEntry | undefined {
  return manifest.projects.find((pr) => pr.chapterSlug === chapterSlug);
}
