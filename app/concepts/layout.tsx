import { HomeButton } from "@/components/home-button";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";

export default function ConceptsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between h-14">
          <HomeButton />
          <div className="flex items-center gap-2">
            <SearchTrigger />
            <SettingsDropdown />
          </div>
        </div>
      </nav>

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
