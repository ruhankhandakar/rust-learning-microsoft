"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Settings, ChevronDown, Loader2 } from "lucide-react";
import { useSessionLite } from "./session-provider";

const SettingsDropdownContent = dynamic(
  () => import("./settings-dropdown").then((m) => m.SettingsDropdown),
  { ssr: false }
);

export function SettingsDropdownLazy() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useSessionLite();

  if (loaded) {
    return <SettingsDropdownContent />;
  }

  function trigger() {
    setLoading(true);
    setLoaded(true);
  }

  return (
    <button
      onClick={trigger}
      onMouseEnter={() => setLoaded(true)}
      className="inline-flex items-center justify-center gap-1 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors px-2 outline-none"
      aria-label="Settings"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : user?.image ? (
        <img
          src={user.image}
          alt=""
          className="h-5 w-5 rounded-full"
        />
      ) : (
        <Settings className="h-4 w-4" />
      )}
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
