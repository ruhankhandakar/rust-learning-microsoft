import { NextResponse } from "next/server";
import fs from "fs";
import {
  getRust100ProjectByChapterSlug,
  loadRust100Manifest,
} from "@/lib/rust-100-projects";
import {
  listProjectSourceDir,
  readProjectSourceFile,
  resolveProjectSourcePath,
} from "@/lib/rust-100-project-source";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterSlug = searchParams.get("chapterSlug");
  const relPath = searchParams.get("path") ?? "";

  if (!chapterSlug) {
    return NextResponse.json({ error: "chapterSlug is required" }, { status: 400 });
  }

  const manifest = loadRust100Manifest();
  const project = getRust100ProjectByChapterSlug(manifest, chapterSlug);
  if (!project?.projectDir) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const segments = relPath ? relPath.split("/").filter(Boolean) : [];
  const resolved = resolveProjectSourcePath(project.projectDir, segments);
  if (!resolved) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  const st = fs.statSync(resolved.absolute);
  if (st.isFile()) {
    const fileResult = readProjectSourceFile(resolved.absolute);
    if (fileResult.kind === "text") {
      return NextResponse.json({
        kind: "file",
        path: resolved.relative,
        content: fileResult.content,
      });
    }
    if (fileResult.kind === "large") {
      return NextResponse.json({ kind: "large", path: resolved.relative });
    }
    return NextResponse.json({ kind: "binary", path: resolved.relative });
  }

  const entries = listProjectSourceDir(resolved.absolute);
  return NextResponse.json({
    kind: "dir",
    path: resolved.relative,
    entries,
  });
}

