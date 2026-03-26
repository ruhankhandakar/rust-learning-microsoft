import type { MetadataRoute } from "next";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";

const BASE_URL = "https://rust.learningz.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const bookPages: MetadataRoute.Sitemap = BOOKS.map((book) => ({
    url: `${BASE_URL}/books/${book.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const chapterPages: MetadataRoute.Sitemap = BOOKS.flatMap((book) => {
    const structure = getBookStructure(book.dirName);
    return structure.flatChapters.map((ch) => ({
      url: `${BASE_URL}/books/${book.slug}/${ch.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  });

  return [...staticPages, ...bookPages, ...chapterPages];
}
