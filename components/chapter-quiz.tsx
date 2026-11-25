"use client";

import { useRef, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { recordQuizAnswer } from "@/lib/learner-store";
import type { QuizQuestion } from "@/lib/quizzes";

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {part}
          </code>
        ) : (
          part
        )
      )}
    </>
  );
}

const choiceClass =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Question({ q, n }: { q: QuizQuestion; n: number }) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  const firstChoice = useRef<HTMLButtonElement>(null);
  const recorded = useRef(false);
  const correct = answer === q.compiles;

  const choose = (compiles: boolean) => {
    if (answer !== null) return;
    setAnswer(compiles);
    if (recorded.current) return;
    recorded.current = true;
    recordQuizAnswer(q.id, compiles === q.compiles);
  };

  const choice = (compiles: boolean, label: string) => (
    <button
      ref={compiles ? firstChoice : undefined}
      type="button"
      onClick={() => choose(compiles)}
      aria-pressed={answer === compiles}
      aria-disabled={answer !== null}
      className={`${choiceClass} ${
        answer === compiles
          ? "border-primary bg-primary/10 text-primary"
          : answer === null
            ? "border-border bg-background hover:bg-accent"
            : "border-border bg-background text-muted-foreground cursor-default"
      }`}
    >
      {label}
    </button>
  );

  return (
    <li id={`quiz-${q.id}`} className="scroll-mt-20 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">
        <span className="text-muted-foreground">{n}. </span>
        <Inline text={q.change} />
      </p>
      {q.original !== undefined && (
        <p className="mt-1 text-xs text-muted-foreground">
          Was: <code className="font-mono">{q.original.trim()}</code>
        </p>
      )}
      <pre className="mt-3 overflow-x-auto rounded-lg border border-[oklch(0.24_0.006_260)] bg-[oklch(0.155_0.005_260)] py-3 text-sm leading-relaxed text-[oklch(0.82_0.008_260)]">
        <code className="block min-w-max font-mono">
          {q.code.split("\n").map((line, i) => {
            const changed = i + 1 === q.changedLine;
            return (
              <span
                key={i}
                className={`block border-l-2 pr-4 ${changed ? "border-rust bg-rust/15" : "border-transparent"}`}
              >
                <span
                  aria-hidden
                  className={`inline-block w-10 select-none pr-3 text-right ${changed ? "font-semibold text-rust" : "text-[oklch(0.5_0.01_260)]"}`}
                >
                  {i + 1}
                </span>
                {line}
                {changed && <span className="sr-only"> (changed line)</span>}
              </span>
            );
          })}
        </code>
      </pre>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {choice(true, "Compiles")}
        {choice(false, "Doesn't compile")}
        {answer !== null && (
          <button
            type="button"
            onClick={() => {
              setAnswer(null);
              firstChoice.current?.focus();
            }}
            className={`${choiceClass} border-transparent text-muted-foreground hover:text-foreground`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Try again
          </button>
        )}
      </div>
      <div aria-live="polite" className="text-sm">
        {answer !== null && (
          <div className="mt-3 space-y-1">
            <p
              className={`flex items-center gap-1.5 font-medium ${correct ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}
            >
              {correct ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
              {correct ? "Correct." : "Not quite."}
            </p>
            {q.compiles ? (
              <p>It compiles: rustc accepts this program without errors.</p>
            ) : (
              <p>
                It doesn&apos;t compile. rustc reports{" "}
                <a
                  href={`https://doc.rust-lang.org/error_codes/${q.errorCode}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline underline-offset-2 hover:text-primary"
                >
                  error[{q.errorCode}]
                </a>
                {q.errorLine !== undefined && <> on line {q.errorLine}</>}: <Inline text={q.errorMessage ?? ""} />
                {q.errorLabel && (
                  <>
                    {" "}
                    (<Inline text={q.errorLabel} />)
                  </>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function ChapterQuiz({ questions }: { questions: QuizQuestion[] }) {
  return (
    <section aria-labelledby="chapter-quiz-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="chapter-quiz-heading" className="text-xl font-semibold">
        Check yourself: does it compile?
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Each program is an example from this chapter with one edit. Every answer comes from rustc{" "}
        {questions[0]?.rustc} (edition 2024) run on the exact code shown, not from a person.
      </p>
      <ol className="mt-6 space-y-6">
        {questions.map((q, i) => (
          <Question key={q.id} q={q} n={i + 1} />
        ))}
      </ol>
    </section>
  );
}
