import { NextResponse } from "next/server";
import fs from "fs";
import {
  getRust100ProjectByChapterSlug,
  loadRust100Manifest,
} from "@/lib/rust-100-projects";
import {
  listProjectSourceDir,
  listRust100SourceParams,
  readProjectSourceFile,
  resolveProjectSourcePath,
} from "@/lib/rust-100-project-source";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listRust100SourceParams().map(({ chapterSlug, segments }) => ({
    chapterSlug,
    path: segments,
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chapterSlug: string; path?: string[] }> }
) {
  const { chapterSlug, path } = await params;
  const project = getRust100ProjectByChapterSlug(loadRust100Manifest(), chapterSlug);
  const resolved = project?.projectDir
    ? resolveProjectSourcePath(project.projectDir, path)
    : null;
  if (!resolved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (fs.statSync(resolved.absolute).isFile()) {
    const file = readProjectSourceFile(resolved.absolute);
    return NextResponse.json(
      file.kind === "text"
        ? { kind: "file", path: resolved.relative, content: file.content }
        : { kind: file.kind, path: resolved.relative }
    );
  }

  return NextResponse.json({
    kind: "dir",
    path: resolved.relative,
    entries: listProjectSourceDir(resolved.absolute),
  });
}
