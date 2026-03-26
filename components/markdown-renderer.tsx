"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlightSafe from "@/lib/rehype-highlight-safe";
import { Check, Copy, Bookmark as BookmarkIcon } from "lucide-react";
import { useBookmarks } from "./bookmark-provider";

const MermaidDiagram = dynamic(
  () => import("./mermaid-diagram").then((m) => m.MermaidDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading diagram...
      </div>
    ),
  }
);

function isMermaidBlock(children: ReactNode): string | null {
  if (!children || typeof children !== "object") return null;
  const child = Array.isArray(children) ? children[0] : children;
  if (
    child &&
    typeof child === "object" &&
    "props" in child
  ) {
    const props = (child as React.ReactElement<{ className?: string; children?: string }>).props;
    if (
      typeof props.className === "string" &&
      props.className.includes("language-mermaid") &&
      typeof props.children === "string"
    ) {
      return props.children.trim();
    }
  }
  return null;
}

function CodePre({ children }: { children?: ReactNode }) {
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

function CopyablePre({ children }: { children?: ReactNode }) {
  const mermaidCode = isMermaidBlock(children);
  if (mermaidCode) {
    return <MermaidDiagram chart={mermaidCode} />;
  }
  return <CodePre>{children}</CodePre>;
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

  const hasLink = containsLink(children);

  return (
    <Tag id={id} className="group/heading relative">
      {hasLink ? children : (
        <a href={`#${id}`} className="no-underline">
          {children}
        </a>
      )}
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
            : "text-muted-foreground opacity-0 group-hover/heading:opacity-100 max-lg:opacity-100"
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

function containsLink(node: ReactNode): boolean {
  if (!node) return false;
  if (Array.isArray(node)) return node.some(containsLink);
  if (typeof node === "object" && "type" in node) {
    const el = node as React.ReactElement<{ children?: ReactNode }>;
    if (el.type === "a") return true;
    return containsLink(el.props?.children);
  }
  return false;
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
          rehypeRaw,
          rehypeHighlightSafe,
        ]}
        components={{
          pre: CopyablePre,
          table: ({ children }) => (
            <div className="table-wrapper">
              <table>{children}</table>
            </div>
          ),
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
