"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FolderTree } from "lucide-react";
import { Rust100ProjectSourcePanel } from "./rust-100-project-source-panel";

export function Rust100ProjectSourceMobile({
  chapterSlug,
  projectDir,
  initialEntries,
}: {
  chapterSlug: string;
  projectDir: string;
  initialEntries: { name: string; kind: "dir" | "file"; size: number | null }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))]">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="flex h-14 w-full items-center justify-center gap-2 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors">
          <FolderTree className="h-4 w-4 text-primary" />
          Source code
          <span className="text-xs font-normal text-muted-foreground">
            — browse files
          </span>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton
          className="max-h-[min(88vh,720px)] overflow-y-auto rounded-t-2xl border-t px-4 pb-8 pt-2"
        >
          <SheetTitle className="sr-only">Source code and project links</SheetTitle>
          <div className="pt-2">
            <Rust100ProjectSourcePanel
              chapterSlug={chapterSlug}
              projectDir={projectDir}
              initialEntries={initialEntries}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
