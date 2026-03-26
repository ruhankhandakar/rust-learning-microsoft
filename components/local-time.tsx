"use client";

import { useEffect, useState } from "react";

export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(
      new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, [iso]);

  if (!text) return null;

  return (
    <span className="hidden sm:inline" title={iso}>
      Updated {text}
    </span>
  );
}
