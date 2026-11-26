"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck, CircleX } from "lucide-react";
import { checkQuiz } from "@/lib/quiz-client";
import type { QuizAnswer } from "@/lib/quizzes";

export interface CompileQuestion {
  id: string;
  code: string;
  change: string;
  changedLine: number;
  source: string;
  href: string;
}

const choice =
  "flex min-h-14 items-center gap-3 rounded-xl border border-border bg-background/60 px-4 text-left font-semibold transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-colors motion-reduce:hover:translate-y-0";
const kbd = "ml-auto hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] font-normal text-muted-foreground sm:inline";

export function CompileCard({ questions, rustc }: { questions: CompileQuestion[]; rustc: string }) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [result, setResult] = useState<QuizAnswer | "failed" | null>(null);
  const verdictRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const q = questions[i];
  const answered = answer !== null;
  const graded = result !== null && result !== "failed" ? result : null;
  const right = graded !== null && answer === graded.compiles;

  async function choose(compiles: boolean) {
    setAnswer(compiles);
    const r = await checkQuiz(q.id, { answer: compiles, practice: true });
    setResult(r ?? "failed");
    requestAnimationFrame(() => verdictRef.current?.focus());
  }

  useEffect(() => {
    if (answered) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cardRef.current!);
    const onKey = (e: KeyboardEvent) => {
      if (!visible || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, [contenteditable], [role=dialog]")) return;
      const k = e.key.toLowerCase();
      if (k === "y" || k === "n") choose(k === "y");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [answered]);

  return (
    <div ref={cardRef} className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="min-w-0 border-b border-border md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-[13px] text-muted-foreground">
          <a href={q.href} className="truncate hover:text-primary">{q.source}</a>
          <span className="shrink-0 font-mono">main.rs</span>
        </div>
        <pre className="m-0 overflow-x-auto py-4 font-mono text-[13px] leading-[1.7]">
          {q.code.split("\n").map((line, n) => {
            const no = n + 1;
            const error = !!graded && !graded.compiles && no === graded.errorLine;
            const changed = no === q.changedLine;
            return (
              <div
                key={no}
                className={`flex border-l-2 pr-5 ${error ? "border-red-400 bg-red-500/10" : changed ? "border-primary bg-primary/10" : "border-transparent"}`}
              >
                <span aria-hidden="true" className="w-10 shrink-0 select-none pr-3 text-right text-muted-foreground/60">{no}</span>
                <code>{line || " "}</code>
              </div>
            );
          })}
        </pre>
      </div>

      <div className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Does it compile?</h3>
          <span className="text-xs tabular-nums text-muted-foreground">
            <span className="sr-only">Question </span>
            {i + 1} / {questions.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          One line differs from the book&apos;s example: <span className="text-foreground">{q.change.toLowerCase()}</span>. It&apos;s marked in orange.
        </p>

        {!answered ? (
          <div className="mt-auto flex flex-col gap-2">
            <button type="button" className={`${choice} hover:border-emerald-500/60 hover:bg-emerald-500/10`} onClick={() => choose(true)}>
              <CircleCheck className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
              Compiles
              <kbd className={kbd}>Y</kbd>
            </button>
            <button type="button" className={`${choice} hover:border-red-400/60 hover:bg-red-500/10`} onClick={() => choose(false)}>
              <CircleX className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
              Doesn&apos;t compile
              <kbd className={kbd}>N</kbd>
            </button>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-3">
            <p ref={verdictRef} tabIndex={-1} className={`text-lg font-bold outline-none ${!graded ? "text-muted-foreground" : right ? "text-emerald-500" : "text-red-400"}`}>
              {result === null
                ? "Checking…"
                : !graded
                  ? "Couldn't check your answer. Check your connection."
                  : `${right ? "Right" : "Not quite"}: it ${graded.compiles ? "compiles" : "does not compile"}.`}
            </p>
            {graded && !graded.compiles && graded.errorMessage && (
              <p className="font-mono text-[13px] text-foreground/90">
                error[{graded.errorCode}]: {graded.errorMessage}
                {graded.errorLine ? ` (line ${graded.errorLine})` : ""}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Checked by {rustc}.</p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => {
                setAnswer(null);
                setResult(null);
                setI((i + 1) % questions.length);
              }}
            >
              Next question
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
