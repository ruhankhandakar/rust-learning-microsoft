// Usage: pnpm tsx scripts/check-exercises.tsx — prints exercise counts and exits 1 if the build-time index
// (markdown scanner) disagrees with what rehype-exercises marks on the rendered chapter pages.
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Root } from "hast";
import { BOOKS } from "../lib/books";
import { getBookStructure, getChapterMarkdown } from "../lib/content";
import { getAllExercises, markdownEvents } from "../lib/exercises";
import rehypeExercises, { exerciseId, findExercises, hastEvents, type FoundExercise } from "../lib/rehype-exercises";
import { ExerciseDetails } from "../components/exercise-details";

const all = getAllExercises();
const errors: string[] = [];
const key = (f: FoundExercise) => `${f.slug}|${f.difficulty}`;

for (const book of BOOKS.filter((b) => b.slug !== "100-rust-projects")) {
  for (const ch of getBookStructure(book.dirName).flatChapters) {
    const where = `${book.slug}/${ch.slug}`;
    const md = getChapterMarkdown(book.dirName, ch.slug);
    let fromHast: FoundExercise[] = [];
    const capture = () => (tree: Root) => {
      fromHast = findExercises(hastEvents(tree).events);
    };
    const html = renderToStaticMarkup(
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, capture, rehypeExercises]}
        components={{ details: (p) => <ExerciseDetails {...p} bookSlug={book.slug} chapterSlug={ch.slug} /> }}
      >
        {md}
      </ReactMarkdown>
    );

    const fromMarkdown = findExercises(markdownEvents(md));
    if (fromHast.map(key).join() !== fromMarkdown.map(key).join())
      errors.push(`${where}: markdown scanner [${fromMarkdown.map(key)}] vs hast [${fromHast.map(key)}]`);

    const indexed = all.filter((e) => e.bookSlug === book.slug && e.chapterSlug === ch.slug);
    const onPage = [...html.matchAll(/data-exercise="([^"]*)"/g)].map((m) => exerciseId(book.slug, ch.slug, m[1]));
    if (onPage.join() !== indexed.map((e) => e.id).join())
      errors.push(`${where}: page toggles [${onPage}] vs index [${indexed.map((e) => e.id)}]`);
    const ids = [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]);
    for (const e of indexed) {
      if (ids.filter((id) => id === e.anchor).length !== 1)
        errors.push(`${where}: anchor ${e.anchor} is missing or not unique`);
    }
  }
}

const counts = new Map<string, { total: number; tagged: number }>();
for (const e of all) {
  const c = counts.get(e.bookSlug) ?? { total: 0, tagged: 0 };
  c.total++;
  if (e.difficulty) c.tagged++;
  counts.set(e.bookSlug, c);
}
const tagged = all.filter((e) => e.difficulty).length;
console.log(`${all.length} exercises (${tagged} with difficulty, ${all.length - tagged} without)`);
for (const [book, c] of counts) console.log(`  ${book}: ${c.total} (${c.tagged} with difficulty)`);

if (all.length === 0) errors.push("no exercises found");
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log("index matches the rendered chapter pages");
