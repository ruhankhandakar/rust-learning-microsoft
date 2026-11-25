"use client";

import { useEffect, useState } from "react";

const WORDS = ["C++", "C#", "Python", "Java"];

export function RotatingWord() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <span className="sr-only">C++, C#, Python or Java</span>
      <span aria-hidden="true" className="inline-block w-[6ch] whitespace-nowrap text-primary [perspective:600px]">
        <span key={i} className="word-in inline-block origin-bottom">
          {WORDS[i]}
        </span>
      </span>
    </>
  );
}
