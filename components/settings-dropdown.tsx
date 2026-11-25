"use client";

import { Settings, Sun, Moon, Check, Minus, Plus, LogOut, ChevronDown } from "lucide-react";
import { BookmarksPanel } from "./bookmarks-panel";
import { StorageUsage } from "./storage-usage";
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
import { GitHubMark } from "@/components/github-sign-in";
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
        className="inline-flex items-center justify-center gap-1 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors px-2 outline-none"
        aria-label="Settings"
      >
        {session?.user?.image ? (
          <img src={session.user.image} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <Settings className="h-4 w-4" />
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
              <GitHubMark />
              Sign in with GitHub
              <span className="ml-auto text-[10px] text-muted-foreground">sync progress</span>
            </button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Bookmarks */}
        <div className="px-1 py-1">
          <BookmarksPanel />
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

        <DropdownMenuSeparator />

        {/* Storage */}
        <StorageUsage />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
