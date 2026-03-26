"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "@/lib/auth-client";
import { pullPreferences, pushPreferences } from "@/lib/preferences";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    setTheme(stored ?? preferred);
    setMounted(true);
  }, []);

  // Sync from cloud on login / coming back online
  useEffect(() => {
    if (!isLoggedIn || !mounted) return;
    let cancelled = false;

    async function sync() {
      const prefs = await pullPreferences();
      if (cancelled || !prefs) return;
      if (prefs.theme === "light" || prefs.theme === "dark") {
        setTheme(prefs.theme);
        try { localStorage.setItem("theme", prefs.theme); } catch {}
      }
    }

    sync();
    window.addEventListener("online", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("online", sync);
    };
  }, [isLoggedIn, mounted]);

  // Apply dark class + persist
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (isLoggedIn) pushPreferences({ theme: next });
      return next;
    });
  }, [isLoggedIn]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
