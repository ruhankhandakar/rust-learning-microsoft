"use client";

import { useState, useRef, useCallback, useMemo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlightSafe from "@/lib/rehype-highlight-safe";
import rehypeExercises from "@/lib/rehype-exercises";
import { hashCode } from "@/lib/rust-blocks";
import { RustCodeActions } from "./rust-code-actions";
import { ExerciseDetails } from "./exercise-details";
import { Check, Copy, Bookmark as BookmarkIcon } from "lucide-react";
import { useBookmarks } from "./bookmark-provider";
import { slugify } from "@/lib/utils";

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

type Runnable = Record<string, "main" | "wrap">;

// Synced upstream markdown is third-party input: only plain document elements survive, others are unwrapped to their text.
const ALLOWED_ELEMENTS = [
  "a", "b", "blockquote", "br", "code", "del", "details", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i",
  "img", "input", "kbd", "li", "ol", "p", "pre", "section", "span", "strong", "sub", "summary", "sup",
  "table", "tbody", "td", "th", "thead", "tr", "ul",
];

function codeLang(children: ReactNode): string | undefined {
  const child = Array.isArray(children) ? children[0] : children;
  if (!child || typeof child !== "object" || !("props" in child)) return undefined;
  return (child as React.ReactElement<{ className?: string }>).props.className?.match(/language-([\w-]+)/)?.[1];
}

function CodePre({ children, runnable }: { children?: ReactNode; runnable?: Runnable }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const lang = codeLang(children);
  const rust = (() => {
    if (lang !== "rust" || !runnable) return null;
    const code = extractText(children).replace(/\n$/, "");
    return { code, mode: runnable?.[hashCode(code)] };
  })();

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
      {rust && <RustCodeActions code={rust.code} mode={rust.mode} />}
    </div>
  );
}

function CopyablePre({ children, runnable }: { children?: ReactNode; runnable?: Runnable }) {
  const mermaidCode = isMermaidBlock(children);
  if (mermaidCode) {
    return <MermaidDiagram chart={mermaidCode} />;
  }
  return <CodePre runnable={runnable}>{children}</CodePre>;
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
  runnable,
}: {
  content: string;
  bookSlug: string;
  chapterSlug: string;
  runnable?: Runnable;
}) {
  const components = useMemo<Components>(() => {
    const heading = (level: number) => {
      const Heading = ({ children }: { children?: ReactNode }) => (
        <BookmarkableHeading level={level} bookSlug={bookSlug} chapterSlug={chapterSlug}>
          {children}
        </BookmarkableHeading>
      );
      return Heading;
    };
    return {
      pre: ({ children }) => <CopyablePre runnable={runnable}>{children}</CopyablePre>,
      details: (props) => (
        <ExerciseDetails {...props} bookSlug={bookSlug} chapterSlug={chapterSlug} />
      ),
      table: ({ children }) => (
        <div className="table-wrapper">
          <table>{children}</table>
        </div>
      ),
      h1: heading(1),
      h2: heading(2),
      h3: heading(3),
      h4: heading(4),
      h5: heading(5),
      h6: heading(6),
    };
  }, [bookSlug, chapterSlug, runnable]);

  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          ...(bookSlug === "100-rust-projects" ? [] : [rehypeExercises]),
          rehypeHighlightSafe,
        ]}
        components={components}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
