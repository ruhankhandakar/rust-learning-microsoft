import { BOOKS, getBookBySlug } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { OG_SIZE, shareCard } from "@/lib/og";

export const alt = "Chapter from Rust Training";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return BOOKS.flatMap((book) => getBookStructure(book.dirName).flatChapters.map((ch) => ({ bookSlug: book.slug, chapterSlug: ch.slug })));
}

export default async function Image({ params }: { params: Promise<{ bookSlug: string; chapterSlug: string }> }) {
  const { bookSlug, chapterSlug } = await params;
  const book = getBookBySlug(bookSlug)!;
  const chapter = getBookStructure(book.dirName).flatChapters.find((c) => c.slug === chapterSlug)!;
  const rust100 = bookSlug === "100-rust-projects";
  const num = chapter.title.match(/^(\d+)\./)?.[1];
  return shareCard({
    kicker: num ? `${book.title}, chapter ${num}` : book.title,
    title: chapter.title.replace(/^\d+(\.\d+)*\.\s*/, ""),
    tag: book.level,
    code: 'fn main() {\n    let s = String::from("hi");\n    let t = &s;\n    println!("{t}");\n}',
    footer: ["Free Rust course with runnable examples and quizzes", rust100 ? "Notes: emmaglorypraise/100rustprojects" : "Content: microsoft/RustTraining, CC BY 4.0"],
  });
}
