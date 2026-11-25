export const hasMain = (code: string) => /\bfn\s+main\s*\(/.test(code);

/** The exact source the Playground receives for a "wrap" block; scripts/check-rust-blocks.ts compiles the same text. */
export const wrapInMain = (code: string) => `fn main() {\n${code}\n}`;
