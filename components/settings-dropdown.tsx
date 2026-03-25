"use client";

import { Settings, Sun, Moon, Check, Minus, Plus, LogOut } from "lucide-react";
import { useTheme } from "./theme-provider";
import {
  useFont,
  FONT_OPTIONS,
  FONT_CSS_MAP,
  SIZE_OPTIONS,
  type FontFamily,
  type FontSize,
} from "./font-provider";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function SettingsDropdown() {
  const { theme, toggle } = useTheme();
  const { fontFamily, fontSize, setFontFamily, setFontSize } = useFont();
  const { data: session, isPending } = useSession();
  const sizeIdx = SIZE_OPTIONS.findIndex((s) => s.id === fontSize);

  function stepSize(delta: number) {
    const next = sizeIdx + delta;
    if (next >= 0 && next < SIZE_OPTIONS.length) {
      setFontSize(SIZE_OPTIONS[next].id as FontSize);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-2 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors px-2 outline-none"
        aria-label="Settings"
      >
        {session?.user?.image ? (
          <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <Settings className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-0">
        {/* Account */}
        <div className="p-3">
          {isPending ? (
            <div className="h-9 rounded-lg bg-muted animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="h-8 w-8 rounded-full shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {session.user.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{session.user.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn.social({ provider: "github" })}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
              <span className="ml-auto text-[10px] text-muted-foreground">sync progress</span>
            </button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Theme */}
        <div className="px-3 pt-2 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Theme
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => { if (theme === "dark") toggle(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                theme === "light" ? "bg-primary/10 text-primary" : "hover:bg-accent"
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              Light
            </button>
            <button
              onClick={() => { if (theme === "light") toggle(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                theme === "dark" ? "bg-primary/10 text-primary" : "hover:bg-accent"
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              Dark
            </button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Font Family */}
        <div className="px-3 pt-2 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Reading Font
          </p>
          <div className="space-y-0.5">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFontFamily(f.id as FontFamily)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  fontFamily === f.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                }`}
              >
                <span style={{ fontFamily: FONT_CSS_MAP[f.id] }}>
                  {f.label}
                  <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                    {f.category}
                  </span>
                </span>
                {fontFamily === f.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Font Size */}
        <div className="px-3 pt-2 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Font Size
          </p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => stepSize(-1)}
              disabled={sizeIdx === 0}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2">
              {SIZE_OPTIONS.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i <= sizeIdx ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => stepSize(1)}
              disabled={sizeIdx === SIZE_OPTIONS.length - 1}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-1">
            {SIZE_OPTIONS[sizeIdx]?.label}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
