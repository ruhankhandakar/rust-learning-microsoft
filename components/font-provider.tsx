"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSessionLite } from "./session-provider";
import { pullPreferences, pushPreferences } from "@/lib/preferences";

export type FontFamily = "geist" | "inter" | "lora" | "merriweather" | "jetbrains";
export type FontSize = "sm" | "base" | "lg" | "xl";

export const FONT_OPTIONS: { id: FontFamily; label: string; category: string }[] = [
  { id: "geist", label: "Geist Sans", category: "Sans" },
  { id: "inter", label: "Inter", category: "Sans" },
  { id: "lora", label: "Lora", category: "Serif" },
  { id: "merriweather", label: "Merriweather", category: "Serif" },
  { id: "jetbrains", label: "JetBrains Mono", category: "Mono" },
];

export const SIZE_OPTIONS: { id: FontSize; label: string }[] = [
  { id: "sm", label: "Small" },
  { id: "base", label: "Default" },
  { id: "lg", label: "Large" },
  { id: "xl", label: "Extra Large" },
];

const FONT_CSS_MAP: Record<FontFamily, string> = {
  geist: "var(--font-geist-sans)",
  inter: "var(--font-inter)",
  lora: "var(--font-lora)",
  merriweather: "var(--font-merriweather)",
  jetbrains: "var(--font-jetbrains)",
};

interface FontContextValue {
  fontFamily: FontFamily;
  fontSize: FontSize;
  setFontFamily: (f: FontFamily) => void;
  setFontSize: (s: FontSize) => void;
}

const FontContext = createContext<FontContextValue>({
  fontFamily: "geist",
  fontSize: "base",
  setFontFamily: () => {},
  setFontSize: () => {},
});

export function useFont() {
  return useContext(FontContext);
}

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("geist");
  const [fontSize, setFontSizeState] = useState<FontSize>("base");
  const { user } = useSessionLite();
  const isLoggedIn = !!user;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("reading-font");
      const savedSize = localStorage.getItem("reading-font-size");
      if (saved) setFontFamilyState(saved as FontFamily);
      if (savedSize) setFontSizeState(savedSize as FontSize);
    } catch {}
  }, []);

  // Sync from cloud on login / coming back online
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    async function sync() {
      const prefs = await pullPreferences();
      if (cancelled || !prefs) return;

      if (prefs.font_family) {
        setFontFamilyState(prefs.font_family as FontFamily);
        try { localStorage.setItem("reading-font", prefs.font_family); } catch {}
      }
      if (prefs.font_size) {
        setFontSizeState(prefs.font_size as FontSize);
        try { localStorage.setItem("reading-font-size", prefs.font_size); } catch {}
      }
    }

    sync();
    window.addEventListener("online", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("online", sync);
    };
  }, [isLoggedIn]);

  // Apply data attributes
  useEffect(() => {
    document.documentElement.setAttribute("data-font", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
  }, [fontSize]);

  const setFontFamily = useCallback((f: FontFamily) => {
    setFontFamilyState(f);
    try { localStorage.setItem("reading-font", f); } catch {}
    if (isLoggedIn) pushPreferences({ font_family: f });
  }, [isLoggedIn]);

  const setFontSize = useCallback((s: FontSize) => {
    setFontSizeState(s);
    try { localStorage.setItem("reading-font-size", s); } catch {}
    if (isLoggedIn) pushPreferences({ font_size: s });
  }, [isLoggedIn]);

  return (
    <FontContext.Provider
      value={{ fontFamily, fontSize, setFontFamily, setFontSize }}
    >
      {children}
    </FontContext.Provider>
  );
}

export { FONT_CSS_MAP };
