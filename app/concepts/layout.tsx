import { SiteHeader } from "@/components/site-header";

export default function ConceptsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1">{children}</main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-3xl px-6 py-5 text-xs text-muted-foreground">
          From Microsoft&apos;s{" "}
          <a
            href="https://github.com/microsoft/RustTraining"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            RustTraining
          </a>{" "}
          (CC BY 4.0); unofficial reader, not affiliated with Microsoft.
        </p>
      </footer>
    </div>
  );
}
