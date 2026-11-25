export interface RustBlock {
  code: string;
  flags: string[];
}

const FENCE = /^((?:[ \t]*>)*)([ \t]*)(`{3,})rust([^\n`]*)\n([\s\S]*?)^(?:[ \t]*>)*[ \t]*\3`*[ \t]*$/gm;

/** Rust fenced blocks as remark sees them: blockquote markers and fence indentation stripped, no trailing newline. */
export function extractRustBlocks(markdown: string): RustBlock[] {
  const blocks: RustBlock[] = [];
  for (const m of markdown.matchAll(FENCE)) {
    const quoteDepth = m[1].split(">").length - 1;
    const indent = m[2].length;
    const flags = m[4].split(/[,\s]+/).filter(Boolean);
    const code = m[5]
      .split("\n")
      .map((line) =>
        line
          .replace(new RegExp(`^(?:[ \\t]*>){${quoteDepth}}`), "")
          .replace(new RegExp(`^[ \\t]{0,${indent}}`), "")
      )
      .join("\n")
      .replace(/\n$/, "");
    blocks.push({ code, flags });
  }
  return blocks;
}

/** FNV-1a over the block text with trailing whitespace removed; same value on server and in the browser. */
export function hashCode(code: string): string {
  const text = code.replace(/\s+$/, "");
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
