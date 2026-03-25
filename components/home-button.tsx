import Link from "next/link";

export function HomeButton() {
  return (
    <Link
      href="/"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors text-lg"
      aria-label="Home"
      title="Home"
    >
      🦀
    </Link>
  );
}
