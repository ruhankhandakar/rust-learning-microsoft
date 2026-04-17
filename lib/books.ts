export interface BookMeta {
  slug: string;
  dirName: string;
  title: string;
  shortTitle: string;
  level: string;
  levelColor: string;
  audience: string;
  description: string;
  icon: string;
}

export const BOOKS: BookMeta[] = [
  {
    slug: "rust-for-cpp",
    dirName: "c-cpp-book",
    title: "Rust for C/C++ Programmers",
    shortTitle: "C/C++ → Rust",
    level: "Bridge",
    levelColor: "green",
    audience: "C/C++ developers",
    description:
      "Move semantics, RAII, FFI, embedded, no_std — everything a systems programmer needs to cross over.",
    icon: "⚙️",
  },
  {
    slug: "rust-for-csharp",
    dirName: "csharp-book",
    title: "Rust for C# Programmers",
    shortTitle: "C# → Rust",
    level: "Bridge",
    levelColor: "green",
    audience: "C# / Java / Swift developers",
    description:
      "Ownership & type system explained through the lens of managed-language idioms.",
    icon: "🔷",
  },
  {
    slug: "rust-for-python",
    dirName: "python-book",
    title: "Rust for Python Programmers",
    shortTitle: "Python → Rust",
    level: "Bridge",
    levelColor: "green",
    audience: "Python developers",
    description:
      "Dynamic → static typing, GIL-free concurrency, and blazing-fast CLI tools.",
    icon: "🐍",
  },
  {
    slug: "async-rust",
    dirName: "async-book",
    title: "Async Rust",
    shortTitle: "Async Rust",
    level: "Deep Dive",
    levelColor: "blue",
    audience: "Intermediate Rustaceans",
    description:
      "Tokio, streams, cancellation safety — master the async ecosystem from futures to production.",
    icon: "⚡",
  },
  {
    slug: "rust-patterns",
    dirName: "rust-patterns-book",
    title: "Rust Patterns",
    shortTitle: "Patterns",
    level: "Advanced",
    levelColor: "yellow",
    audience: "Experienced Rustaceans",
    description:
      "Pin, allocators, lock-free structures, unsafe — advanced patterns for real-world systems.",
    icon: "🧩",
  },
  {
    slug: "type-driven-correctness",
    dirName: "type-driven-correctness-book",
    title: "Type-Driven Correctness",
    shortTitle: "Type Safety",
    level: "Expert",
    levelColor: "purple",
    audience: "Expert Rustaceans",
    description:
      "Type-state, phantom types, capability tokens — make illegal states unrepresentable.",
    icon: "🔬",
  },
  {
    slug: "engineering-practices",
    dirName: "engineering-book",
    title: "Rust Engineering Practices",
    shortTitle: "Engineering",
    level: "Practices",
    levelColor: "brown",
    audience: "Teams shipping Rust",
    description:
      "Build scripts, cross-compilation, CI/CD, Miri — production-grade engineering workflows.",
    icon: "🏗️",
  },
  {
    slug: "100-rust-projects",
    dirName: "100-rust-projects",
    title: "100 Rust Projects",
    shortTitle: "100 Projects",
    level: "Projects",
    levelColor: "yellow",
    audience: "Hands-on learners",
    description:
      "A curated path through 100 small Rust projects — CLI, async, web, databases, and more — with notes and links to upstream source.",
    icon: "🧰",
  },
];

export function getBookBySlug(slug: string): BookMeta | undefined {
  return BOOKS.find((b) => b.slug === slug);
}
