import { LocalTime } from "@/components/local-time";
import { APP_VERSION, CONTENT_LAST_UPDATED } from "@/lib/version";
import { REPO_URL } from "@/lib/site-stats";

const link = "font-medium text-foreground underline-offset-2 hover:text-primary hover:underline";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-start md:justify-between">
        <p className="max-w-2xl">
          Unofficial reader, not affiliated with or endorsed by Microsoft. Book content from{" "}
          <a href="https://github.com/microsoft/RustTraining" target="_blank" rel="noopener noreferrer" className={link}>
            microsoft/RustTraining
          </a>{" "}
          under MIT and CC BY 4.0. 100 Rust Projects by{" "}
          <a href="https://github.com/emmaglorypraise" target="_blank" rel="noopener noreferrer" className={link}>
            Glory Praise Emmanuel
          </a>
          .
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>
            Built by{" "}
            <a href="https://x.com/KhandakarRuhan" target="_blank" rel="noopener noreferrer" className={link}>
              Ruhan Khandakar
            </a>
          </span>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={link}>
            GitHub
          </a>
          <LocalTime iso={CONTENT_LAST_UPDATED} />
          <span>v{APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
