import { BOOKS } from "./books";
import { getBookStructure, getChapterMarkdown } from "./content";
import { slugify } from "./utils";

export interface ConceptLink {
  slug: string;
  title: string;
}

export interface ConceptSection {
  bookSlug: string;
  chapterSlug: string;
  chapterTitle: string;
  headingId: string;
  headingText: string;
  excerpt: string;
}

export interface Concept extends ConceptLink {
  summary: string;
  sections: ConceptSection[];
  bookCount: number;
}

interface ConceptDef extends ConceptLink {
  summary: string;
  /** Tested against h1–h3 heading text of the Microsoft books, never body text. */
  match: RegExp[];
}

export const CONCEPT_DEFS: ConceptDef[] = [
  {
    slug: "ownership",
    title: "Ownership and moves",
    summary: "Each value has one owner; assigning or passing a non-Copy value moves it, and it is dropped when the owner goes out of scope.",
    match: [/^(understanding |rust )?ownership\b/i, /\bmove semantics\b/i, /\bownership rules\b/i, /use-after-move/i, /"move" for/i, /copy types vs move types/i, /^rust (clone|copy trait)\b/i, /excessive clone/i, /^copy vs clone\b/i],
  },
  {
    slug: "borrowing",
    title: "Borrowing and references",
    summary: "References let code use a value without taking ownership; the borrow checker allows many shared or one mutable reference at a time.",
    match: [/\bborrow(ing)?\b/i, /^references vs pointers\b/i, /^rust references\b/i, /reference safety/i],
  },
  {
    slug: "lifetimes",
    title: "Lifetimes",
    summary: "Lifetimes describe how long references stay valid, so the compiler can reject dangling references at compile time.",
    match: [/\blifetimes?\b/i],
  },
  {
    slug: "smart-pointers",
    title: "Smart pointers: Box, Rc and Arc",
    summary: "Box puts a value on the heap, Rc and Arc share ownership through reference counting, and Weak breaks reference cycles.",
    match: [/smart pointers?/i, /\bBox<T>/, /\bRc<T>/, /\bArc<T>/, /\bWeak\b/, /\bbox, rc, arc\b/i, /which pointer/i],
  },
  {
    slug: "interior-mutability",
    title: "Interior mutability: Cell and RefCell",
    summary: "Cell and RefCell allow mutation through a shared reference; RefCell enforces the borrowing rules at run time instead of compile time.",
    match: [/interior mutability/i, /\bRefCell\b/, /\bCell<T>/],
  },
  {
    slug: "drop-and-raii",
    title: "Drop and RAII",
    summary: "Resources are released deterministically when their owner goes out of scope, through the Drop trait rather than a garbage collector.",
    match: [/\bdrop\b(?! check)/i, /\bRAII\b/, /resource management/i, /garbage collection/i, /\bIDisposable\b/],
  },
  {
    slug: "strings",
    title: "Strings: String and &str",
    summary: "String is an owned, growable UTF-8 buffer and &str is a borrowed string slice; neither can be indexed by integer position.",
    match: [/\bstring vs &str\b/i, /^rust strings?\b/i, /string types/i, /^string slices/i, /index strings/i, /string conversion/i],
  },
  {
    slug: "enums-and-pattern-matching",
    title: "Enums and pattern matching",
    summary: "An enum value is one of several variants, each of which can carry data, and the compiler checks that a match handles every variant.",
    match: [/pattern matching(?! with arguments)/i, /^rust enum/i, /enum (power|types)\b/i, /algebraic data types/i, /^rust match statement/i, /exhaustive/i, /match as a lookup table/i],
  },
  {
    slug: "option-and-null-safety",
    title: "Option and null safety",
    summary: "Safe Rust has no null references; a possibly absent value is an Option, which must be handled before the inner value can be used.",
    match: [/\bOption\b/, /\bnull\b/i, /\bNone safety\b/i],
  },
  {
    slug: "error-handling",
    title: "Error handling with Result and ?",
    summary: "Recoverable errors are values of type Result, propagated with the ? operator and modelled with custom error types.",
    match: [/error handling/i, /\bResult\b/, /\? operator/i, /\bexceptions? vs\b/i, /hidden exceptions/i, /panic safety/i, /\bthiserror\b/i, /\berror (types|conversion|hierarchy|recovery)\b/i, /^rust error/i],
  },
  {
    slug: "traits",
    title: "Traits",
    summary: "Traits define shared behaviour that types implement, similar to interfaces, with default methods and associated types.",
    match: [/^(rust )?traits\b/i, /^rust trait\b/i, /traits (vs|in depth)\b/i, /duck typing/i, /protocols \(/i, /^trait definition/i, /associated types/i, /standard library traits/i, /essential traits/i, /operator overloading/i, /extension traits/i, /blanket impl/i, /supertraits/i],
  },
  {
    slug: "generics",
    title: "Generics and trait bounds",
    summary: "Generic code works over many types, constrained by trait bounds, and is compiled into specialised copies for each concrete type.",
    match: [/\bgenerics\b/i, /trait bounds?/i, /generic constraints/i, /monomorphization/i, /const generics/i],
  },
  {
    slug: "trait-objects",
    title: "Trait objects and dyn",
    summary: "A trait object such as Box<dyn Trait> pairs a data pointer with a vtable, dispatching method calls at run time.",
    match: [/\bdyn\b/i, /trait objects?/i, /dynamic (dispatch|traits)/i, /\bvtables?\b/i, /object safety/i],
  },
  {
    slug: "conversions",
    title: "Type conversions: From, Into and TryFrom",
    summary: "Rust has no implicit conversions; types convert explicitly with as casts or the From, Into, TryFrom and TryInto traits.",
    match: [/\bFrom\b.*\bInto\b/, /\bTryFrom\b/, /type (casting and )?conversions/i, /^(other rust type|numeric|string|reference) conversions/i, /casting hierarchy/i, /conversion chains/i],
  },
  {
    slug: "closures",
    title: "Closures",
    summary: "Closures are anonymous functions that capture their environment by reference, by mutable reference or by value (Fn, FnMut, FnOnce).",
    match: [/\bclosures?\b/i, /\bFnMut\b|\bFnOnce\b/, /\blambdas?\b/i, /higher-order/i],
  },
  {
    slug: "iterators",
    title: "Iterators",
    summary: "Iterators produce values lazily; adapters such as map and filter chain without intermediate collections until a consumer like collect runs.",
    match: [/\biterators?\b(?! invalidation)/i, /\bLINQ\b/, /comprehensions/i, /\bgenerators\b/i, /^collect/i, /\bitertools\b/i, /iteration patterns/i],
  },
  {
    slug: "modules-and-crates",
    title: "Modules, crates and Cargo",
    summary: "Code is organised into modules within a crate, and Cargo builds crates, resolves dependencies from crates.io and manages workspaces.",
    match: [/\bmodules?\b(?!-level)/i, /^(rust )?crates\b/i, /\bcrates vs\b/i, /^cargo (vs|project|\.toml|test)\b/i, /\bcargo and crates\b/i, /package management/i, /^workspaces (and|vs)\b/i, /workspace organization/i, /dependency (management|declaration)/i, /\bsemver\b/i, /understanding crates/i, /namespaces/i, /community crates/i],
  },
  {
    slug: "testing",
    title: "Testing",
    summary: "Unit tests live beside the code, integration tests in tests/, and cargo test also runs doc tests; property testing and mocking build on top.",
    match: [/^(unit |integration )?tests?\b/i, /^testing (in rust|patterns|async|no_std|type-level)/i, /\bpytest\b/i, /\bmock(ing|all|s)?\b/i, /property[- ]based testing|property testing/i, /test (fixtures|attributes|helpers)/i, /\bdoc tests?\b/i, /code coverage/i, /integration tests/i],
  },
  {
    slug: "macros",
    title: "Macros",
    summary: "Declarative macros generate code from patterns with macro_rules!, and procedural macros such as derive run Rust code at compile time.",
    match: [/\bmacros\b/i, /\bmacro_rules!/i],
  },
  {
    slug: "unsafe",
    title: "Unsafe code",
    summary: "An unsafe block unlocks operations the compiler cannot verify, such as raw pointer dereferences, and the author must uphold the invariants.",
    match: [/\bunsafe\b/i, /undefined behavior|\bUB\b/, /\bmiri\b/i, /sound abstractions/i],
  },
  {
    slug: "ffi",
    title: "FFI and interop",
    summary: "The foreign function interface lets Rust call C and be called from C, C# or Python, using extern functions and C-compatible types.",
    match: [/\bFFI\b/, /\binterop\b/i, /\bPyO3\b/, /calling c\b/i, /\bCString\b/],
  },
  {
    slug: "concurrency",
    title: "Threads, channels and shared state",
    summary: "Threads communicate through channels or share data through Arc, Mutex, RwLock and atomics, and data races are rejected at compile time.",
    match: [/^rust concurrency/i, /\bchannels?\b/i, /message passing/i, /\bthreads\b/i, /thread safety/i, /parallelism/i, /\bmutex\b/i, /\bRwLock\b/, /\batomics\b/i, /\bGIL\b/, /\bcondvar\b/i, /\brayon\b/i, /lock-free/i],
  },
  {
    slug: "send-and-sync",
    title: "Send and Sync",
    summary: "The Send and Sync marker traits record which types may move to or be shared between threads, and the compiler enforces them.",
    match: [/\bSend\b/, /!Sync\b/],
  },
  {
    slug: "async-await",
    title: "async/await and futures",
    summary: "An async fn returns a future, a lazy state machine that a runtime such as Tokio polls to completion.",
    match: [/\basync\b/i, /\bawait\b/i, /\bfutures?\b/i, /\btokio\b/i, /\bexecutors?\b/i],
  },
  {
    slug: "pin",
    title: "Pin and Unpin",
    summary: "Pin guarantees that a value will not move in memory unless it is Unpin, which self-referential types such as many futures rely on.",
    match: [/\bpin\b/i, /\bunpin\b/i, /self-referential/i, /\bpinning\b/i],
  },
  {
    slug: "newtype",
    title: "The newtype pattern",
    summary: "A newtype wraps an existing type in a single-field struct, giving it a distinct type and invariants at no runtime cost.",
    match: [/newtypes?/i, /tuple structs?/i, /parse,? don't validate/i, /validated types/i],
  },
  {
    slug: "type-state",
    title: "Type-state and phantom types",
    summary: "Type-state encodes an object's state in its type, often with PhantomData, so invalid state transitions fail to compile.",
    match: [/type[- ]?state/i, /phantom/i],
  },
  {
    slug: "no-std-embedded",
    title: "no_std and embedded",
    summary: "A no_std crate uses only core and optionally alloc, so it can run on microcontrollers and other targets without an operating system.",
    match: [/\bno_std\b/i, /\bembedded\b/i, /bare[- ]metal/i, /\binterrupts?\b/i, /\bMMIO\b/, /\bembassy\b/i, /panic handlers?/i],
  },
  {
    slug: "memory-layout",
    title: "Memory layout and zero-cost abstractions",
    summary: "Rust controls where data lives and how it is laid out, and abstractions like generics and iterators compile to hand-written-equivalent code.",
    match: [/memory layout/i, /zero[- ]cost abstractions?/i, /\brepr\(C\)/i, /fat pointers/i, /zero-sized types/i, /monomorphization/i, /stack (vs|and) heap/i, /(custom|global) allocators?/i],
  },
  {
    slug: "performance",
    title: "Performance, benchmarking and profiling",
    summary: "Benchmarking with tools like Criterion and profiling with perf and flamegraphs show where Rust code spends its time.",
    match: [/^performance\b/i, /performance comparison/i, /for performance$/i, /\bbenchmark(s|ing)?\b/i, /\bprofil(ing|e-guided)\b/i, /flamegraphs?/i, /\bcriterion\b/i],
  },
  {
    slug: "serialization",
    title: "Serialization with serde",
    summary: "Serde derives serialization and deserialization for Rust types, with format crates for JSON and many others, including zero-copy deserialization.",
    match: [/\bserde\b/i, /serialization|deserializ/i, /\bJSON\b/],
  },
  {
    slug: "conditional-compilation",
    title: "Feature flags and conditional compilation",
    summary: "Cargo features and cfg attributes include or exclude code at compile time, per platform or per optional capability.",
    match: [/feature flags?/i, /conditional compilation/i, /\bcfg(_attr)?\b/i, /^features:/i],
  },
];

const SKIP_CHAPTER = /^ch00-|exercises$|reference-card$|capstone|keywords-reference/;
const SKIP_HEADING =
  /^(exercises?\b|solution|key takeaways|quick reference|step \d+|try it yourself|further reading|real(-world)? example)|visualization$|keywords$|:$/i;
const WHAT_YOU_LEARN = /^what you'll learn:?[;\s]*/i;
const POINTS_AT_CODE = /^(this example|let's break down|each line|note:)/i;

interface Heading {
  level: number;
  id: string;
  text: string;
  excerpt: string;
}

type Block = { heading: Heading } | { text: string; quote: boolean };

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

/** Inline markdown → the text react-markdown renders (code kept, tags and markup dropped). */
function inlineText(md: string): string {
  const code: string[] = [];
  return decode(
    md
      .replace(/`+([^`]+?)`+/g, (_, c: string) => `\u0000${code.push(c) - 1}\u0000`)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<\/?[a-z][^>]*>/gi, "")
      .replace(/\\([!-/:-@[-`{-~])/g, "$1")
      .replace(/\*\*|__|\*|~~/g, "")
      .replace(/\u0000(\d+)\u0000/g, (_, i: string) => code[Number(i)])
  )
    .replace(/\s+/g, " ")
    .trim();
}

const displayHeading = (text: string) =>
  text
    .replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")
    .replace(/^\d+(\.\d+)*\.?\s+/, "")
    .replace(/\s*(🟢|🟡|🟠|🔴|★).*$/u, "")
    .trim();

function clip(text: string, max = 220): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.—–-]+$/, "")}…`;
}

const isProse = (line: string) => !/^\s*([-*+]\s|\d+[.)]\s|[|#<!]|```|~~~|---|\[\^?\w+\]:)/.test(line);

/**
 * h1–h3 headings with an excerpt: the first prose paragraph directly under the heading, else its
 * "What you'll learn" callout, else the first prose paragraph of its first subsection.
 */
function chapterHeadings(markdown: string): Heading[] {
  const blocks: Block[] = [];
  let fence: string | null = null;
  let lines: string[] = [];
  let quote = false;
  let skipping = false;
  let details = 0;
  const flush = () => {
    if (lines.length) blocks.push({ text: inlineText(lines.join("\n").replace(/\n\s*[-*+]\s+/g, "; ")), quote });
    lines = [];
  };

  for (const line of markdown.split("\n")) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (marker) {
      flush();
      fence = marker;
      continue;
    }
    const tags = line.replace(/`[^`]*`/g, "");
    details = Math.max(0, details + (tags.match(/<details/gi)?.length ?? 0) - (tags.match(/<\/details>/gi)?.length ?? 0));
    const h = line.match(/^(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/);
    if (h) {
      flush();
      const text = inlineText(h[2]);
      blocks.push({ heading: { level: h[1].length, id: slugify(text), text, excerpt: "" } });
      continue;
    }
    const q = line.match(/^\s*>\s?(.*)$/);
    const body = q ? q[1] : line;
    if (!!q !== quote) {
      flush();
      quote = !!q;
      skipping = false;
    }
    if (!body.trim()) {
      flush();
      skipping = false;
    } else if (quote) {
      lines.push(body);
    } else if (!isProse(body) || details) {
      flush();
      skipping = true;
    } else if (!skipping && (lines.length || !/^\s/.test(body))) {
      lines.push(body.trim());
    }
  }
  flush();

  const headings: Heading[] = [];
  blocks.forEach((b, i) => {
    if (!("heading" in b) || b.heading.level > 3) return;
    const found: string[] = [];
    let direct = true;
    for (const next of blocks.slice(i + 1)) {
      if ("heading" in next) {
        if (!direct || next.heading.level <= b.heading.level || SKIP_HEADING.test(displayHeading(next.heading.text))) break;
        direct = false;
        continue;
      }
      if (next.quote && !(direct && WHAT_YOU_LEARN.test(next.text))) continue;
      const text = (next.quote ? next.text.replace(WHAT_YOU_LEARN, "").replace(/\s*Difficulty:.*$/i, "") : next.text).trim();
      if (text.length < 60 || POINTS_AT_CODE.test(text) || (text.endsWith(":") && text.length < 120)) continue;
      const rank = next.quote ? 1 : direct ? 0 : 2;
      found[rank] ??= text.replace(/:$/, "…");
      if (rank === 0) break;
    }
    b.heading.excerpt = clip(found.find(Boolean) ?? "");
    headings.push(b.heading);
  });
  return headings;
}

interface Index {
  concepts: Concept[];
  dropped: { slug: string; reason: string }[];
  byChapter: Map<string, ConceptLink[]>;
}

let cache: Index | null = null;

/** Build-time only (reads content/ from disk). */
function buildIndex(): Index {
  if (cache) return cache;
  const matched = new Map(CONCEPT_DEFS.map((c) => [c.slug, [] as { section: ConceptSection; position: number }[]]));

  for (const book of BOOKS) {
    if (book.slug === "100-rust-projects") continue;
    for (const ch of getBookStructure(book.dirName).flatChapters) {
      if (SKIP_CHAPTER.test(ch.slug)) continue;
      const headings = chapterHeadings(getChapterMarkdown(book.dirName, ch.slug));
      for (const def of CONCEPT_DEFS) {
        // A match covers its subsections, so only the outermost matching heading counts.
        let matchedLevel = 0;
        const hits: number[] = [];
        headings.forEach((h, i) => {
          if (matchedLevel && h.level > matchedLevel) return;
          matchedLevel = 0;
          const text = displayHeading(h.text);
          if (SKIP_HEADING.test(text) || !def.match.some((re) => re.test(text))) return;
          matchedLevel = h.level;
          // The page doesn't dedupe ids, so a repeated heading's link lands on its first occurrence.
          if (headings.findIndex((x) => x.id === h.id) === i) hits.push(i);
        });
        for (const i of hits.slice(0, 2)) {
          const section = {
            bookSlug: book.slug,
            chapterSlug: ch.slug,
            chapterTitle: ch.title,
            headingId: headings[i].id,
            headingText: displayHeading(headings[i].text) || headings[i].text,
            excerpt: headings[i].excerpt,
          };
          matched.get(def.slug)!.push({ section, position: i });
        }
      }
    }
  }

  const concepts: Concept[] = [];
  const dropped: Index["dropped"] = [];
  const byChapter = new Map<string, { link: ConceptLink; position: number }[]>();
  for (const def of CONCEPT_DEFS) {
    const hits = matched.get(def.slug)!;
    const books = new Set(hits.map((h) => h.section.bookSlug));
    if (books.size < 2) {
      dropped.push({
        slug: def.slug,
        reason: hits.length ? `only in ${[...books].join(", ")} (${hits.length} sections)` : "no matching headings",
      });
      continue;
    }
    const link = { slug: def.slug, title: def.title };
    concepts.push({ ...link, summary: def.summary, bookCount: books.size, sections: hits.map((h) => h.section) });
    for (const { section, position } of hits) {
      const key = `${section.bookSlug}/${section.chapterSlug}`;
      const list = byChapter.get(key) ?? [];
      if (!list.some((l) => l.link.slug === def.slug)) list.push({ link, position });
      byChapter.set(key, list);
    }
  }

  cache = {
    concepts,
    dropped,
    byChapter: new Map(
      [...byChapter].map(([key, list]) => [key, list.sort((a, b) => a.position - b.position).slice(0, 4).map((l) => l.link)])
    ),
  };
  return cache;
}

export function getAllConcepts(): Concept[] {
  return buildIndex().concepts;
}

export function getConcept(slug: string): Concept | undefined {
  return buildIndex().concepts.find((c) => c.slug === slug);
}

export function getDroppedConcepts(): Index["dropped"] {
  return buildIndex().dropped;
}

export function getConceptsForChapter(bookSlug: string, chapterSlug: string): ConceptLink[] {
  return buildIndex().byChapter.get(`${bookSlug}/${chapterSlug}`) ?? [];
}
