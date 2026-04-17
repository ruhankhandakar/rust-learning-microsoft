"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

export function Rust100SourceCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy file contents"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
