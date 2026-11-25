import type { MetadataRoute } from "next";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllConcepts } from "@/lib/concepts";
import { getChapterLastChange } from "@/lib/changelog";

const BASE_URL = "https://rust.learningz.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL },
    { url: `${BASE_URL}/practice` },
    { url: `${BASE_URL}/concepts` },
    ...getAllConcepts().map((c) => ({ url: `${BASE_URL}/concepts/${c.slug}` })),
    { url: `${BASE_URL}/changes` },
    ...BOOKS.flatMap((book) => [
      { url: `${BASE_URL}/books/${book.slug}` },
      ...getBookStructure(book.dirName).flatChapters.map((ch) => {
        const lastModified = getChapterLastChange(book.slug, ch.slug);
        return {
          url: `${BASE_URL}/books/${book.slug}/${ch.slug}`,
          ...(lastModified && { lastModified }),
        };
      }),
    ]),
  ];
}
