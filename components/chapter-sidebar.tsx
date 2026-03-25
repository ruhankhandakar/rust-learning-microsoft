"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookMeta } from "@/lib/books";
import { BookStructure } from "@/lib/content";
import { Separator } from "@/components/ui/separator";
import { useProgress } from "./progress-provider";
import { Check } from "lucide-react";

interface ChapterSidebarProps {
  book: BookMeta;
  structure: BookStructure;
  currentSlug: string;
}

export function ChapterSidebar({
  book,
  structure,
  currentSlug,
}: ChapterSidebarProps) {
  const { readSet } = useProgress();

  const isRead = (slug: string) => readSet.has(`${book.slug}/${slug}`);

  return (
    <nav className="space-y-1 text-sm">
      <Link
        href={`/books/${book.slug}`}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors font-medium mb-2"
      >
        <span className="text-lg">{book.icon}</span>
        <span className="truncate">{book.shortTitle}</span>
      </Link>

      <Separator className="!my-3" />

      {structure.introduction && (
        <SidebarLink
          href={`/books/${book.slug}/${structure.introduction.slug}`}
          active={currentSlug === structure.introduction.slug}
          read={isRead(structure.introduction.slug)}
          label="Introduction"
        />
      )}

      {structure.parts.map((part, pi) => (
        <div key={pi} className="pt-4">
          {part.title && (
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {part.title}
            </p>
          )}
          {part.chapters.map((ch) => (
            <div key={ch.slug}>
              <SidebarLink
                href={`/books/${book.slug}/${ch.slug}`}
                active={currentSlug === ch.slug}
                read={isRead(ch.slug)}
                label={ch.title}
              />
              {ch.children.map((sub) => (
                <SidebarLink
                  key={sub.slug}
                  href={`/books/${book.slug}/${sub.slug}`}
                  active={currentSlug === sub.slug}
                  read={isRead(sub.slug)}
                  label={sub.title}
                  sub
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

function SidebarLink({
  href,
  active,
  read,
  label,
  sub,
}: {
  href: string;
  active: boolean;
  read: boolean;
  label: string;
  sub?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md transition-colors truncate",
        sub ? "pl-6 pr-3 py-1 text-xs" : "px-3 py-1.5",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      title={label}
    >
      {read && (
        <Check className="h-3 w-3 text-primary shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
}
