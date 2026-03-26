"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, Bookmark as BookmarkIcon } from "lucide-react";
import { useBookmarks } from "./bookmark-provider";

function CopyablePre({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="pre-wrapper">
      <button
        onClick={handleCopy}
        className="copy-btn"
        aria-label="Copy code"
        type="button"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function BookmarkableHeading({
  level,
  children,
  bookSlug,
  chapterSlug,
}: {
  level: number;
  children?: ReactNode;
  bookSlug: string;
  chapterSlug: string;
}) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const text = extractText(children);
  const id = slugify(text);
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  const active = isBookmarked(bookSlug, chapterSlug, id);

  return (
    <Tag id={id} className="group/heading relative">
      <a href={`#${id}`} className="no-underline">
        {children}
      </a>
      <button
        onClick={() =>
          toggleBookmark({
            book_slug: bookSlug,
            chapter_slug: chapterSlug,
            heading_id: id,
            heading_text: text,
          })
        }
        className={`inline-flex items-center justify-center ml-2 align-middle rounded-md transition-all ${
          active
            ? "text-primary opacity-100"
            : "text-muted-foreground opacity-0 group-hover/heading:opacity-100"
        }`}
        aria-label={active ? "Remove bookmark" : "Bookmark this section"}
        title={active ? "Remove bookmark" : "Bookmark this section"}
      >
        <BookmarkIcon
          className="h-4 w-4"
          fill={active ? "currentColor" : "none"}
        />
      </button>
    </Tag>
  );
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as React.ReactElement<{ children?: ReactNode }>).props.children);
  }
  return "";
}

export function MarkdownRenderer({
  content,
  bookSlug,
  chapterSlug,
}: {
  content: string;
  bookSlug: string;
  chapterSlug: string;
}) {
  const headingComponent =
    (level: number) =>
    ({ children }: { children?: ReactNode }) => (
      <BookmarkableHeading
        level={level}
        bookSlug={bookSlug}
        chapterSlug={chapterSlug}
      >
        {children}
      </BookmarkableHeading>
    );

  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          pre: CopyablePre,
          h1: headingComponent(1),
          h2: headingComponent(2),
          h3: headingComponent(3),
          h4: headingComponent(4),
          h5: headingComponent(5),
          h6: headingComponent(6),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
