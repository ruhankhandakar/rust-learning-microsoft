"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { BookMeta } from "@/lib/books";
import { BookStructure } from "@/lib/content";
import { ChapterSidebar } from "./chapter-sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileNavProps {
  book: BookMeta;
  structure: BookStructure;
  currentSlug: string;
}

export function MobileNav({ book, structure, currentSlug }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetTitle className="sr-only">Chapter navigation</SheetTitle>
        <ScrollArea className="h-full p-4">
          <div onClick={() => setOpen(false)}>
            <ChapterSidebar
              book={book}
              structure={structure}
              currentSlug={currentSlug}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
