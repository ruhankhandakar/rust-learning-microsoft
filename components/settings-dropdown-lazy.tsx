"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Settings, ChevronDown } from "lucide-react";

const SettingsDropdownContent = dynamic(
  () =>
    import("./settings-dropdown").then((m) => m.SettingsDropdown),
  {
    ssr: false,
    loading: () => (
      <button
        className="inline-flex items-center justify-center gap-1 h-9 rounded-lg border border-border bg-card px-2"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4 animate-pulse" />
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
    ),
  }
);

export function SettingsDropdownLazy() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return <SettingsDropdownContent />;
  }

  return (
    <button
      onClick={() => setLoaded(true)}
      onMouseEnter={() => setLoaded(true)}
      className="inline-flex items-center justify-center gap-1 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors px-2 outline-none"
      aria-label="Settings"
    >
      <Settings className="h-4 w-4" />
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
