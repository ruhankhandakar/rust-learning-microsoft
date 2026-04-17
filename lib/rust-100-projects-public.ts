/** Safe for client components — no Node fs */

export const RUST_100_UPSTREAM_USER_REPO = "emmaglorypraise/100rustprojects";

export function projectTreeGithubUrl(projectDir: string | null): string | null {
  if (!projectDir) return null;
  return `https://github.com/${RUST_100_UPSTREAM_USER_REPO}/tree/main/projects/${projectDir}`;
}

export function glossaryGithubUrl(): string {
  return `https://github.com/${RUST_100_UPSTREAM_USER_REPO}/blob/main/glossary.md`;
}

/** Per-file link on github.com (blob) for in-app browser parity. */
export function projectBlobGithubUrl(
  projectDir: string,
  relativePath: string
): string {
  const clean = relativePath.replace(/^\/+/, "").split("/").filter(Boolean);
  const tail = clean.length ? `/${clean.join("/")}` : "";
  return `https://github.com/${RUST_100_UPSTREAM_USER_REPO}/blob/main/projects/${projectDir}${tail}`;
}
