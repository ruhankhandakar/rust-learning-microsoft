import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllConcepts } from "@/lib/concepts";

export const dynamic = "force-static";

const BASE_URL = "https://rust.learningz.xyz";

export function GET() {
  const books = BOOKS.map((book) => {
    const chapters = getBookStructure(book.dirName)
      .flatChapters.map((ch) => `- [${ch.title}](${BASE_URL}/books/${book.slug}/${ch.slug})`)
      .join("\n");
    return `## ${book.title}\n\n${book.description} Audience: ${book.audience}.\n\n${chapters}`;
  });

  const concepts = getAllConcepts()
    .map((c) => `- [${c.title}](${BASE_URL}/concepts/${c.slug})`)
    .join("\n");

  const body = `# Rust Training

> Unofficial, free web reader for Microsoft's open-source RustTraining books (MIT & CC BY 4.0, https://github.com/microsoft/RustTraining) and Glory Praise Emmanuel's 100 Rust Projects (https://github.com/emmaglorypraise/100rustprojects). Not affiliated with Microsoft. Built by Ruhan Khandakar.

## Learning tools

- [Practice exercises](${BASE_URL}/practice): every exercise in the Microsoft books, by book and difficulty.
- [Topics across books](${BASE_URL}/concepts): where each book explains the same Rust concept.
- [What changed](${BASE_URL}/changes): upstream changes to the books, by sync date ([RSS](${BASE_URL}/rss.xml)).

${concepts ? `## Topics\n\n${concepts}\n\n` : ""}${books.join("\n\n")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
