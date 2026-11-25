import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <LogoMark size={72} className="mb-6" />
        <h1 className="text-7xl font-extrabold tracking-tight text-primary mb-2">
          404
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          This page wandered off into unsafe territory. Let&apos;s get you back to safe Rust.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/books/rust-for-cpp"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Start Reading
          </Link>
        </div>
      </div>
    </div>
  );
}
