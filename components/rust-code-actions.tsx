"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX, ExternalLink, LoaderCircle, Play, X } from "lucide-react";
import { hasMain, wrapInMain } from "@/lib/rust-wrap";
import { trackActivity } from "@/lib/learner-store";

type Result =
  | { status: "running" }
  | { status: "done"; success: boolean; exitDetail: string; stdout: string; stderr: string }
  | { status: "error"; message: string };

const EXECUTE_URL = "https://play.rust-lang.org/execute";
const MAX_LINK_LENGTH = 8000;

async function execute(code: string, signal: AbortSignal): Promise<Result> {
  let res: Response;
  try {
    res = await fetch(EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "stable",
        mode: "debug",
        edition: "2024",
        crateType: "bin",
        tests: false,
        backtrace: false,
        code,
      }),
      signal: AbortSignal.any ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : signal,
    });
  } catch (e) {
    if ((e as Error).name === "TimeoutError")
      return { status: "error", message: "The Rust Playground took too long to answer. Try again in a moment." };
    return { status: "error", message: "Couldn't reach the Rust Playground. Check your connection and try again." };
  }
  if (res.status === 429)
    return { status: "error", message: "The Rust Playground is getting too many requests. Wait a minute and try again." };
  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.success !== "boolean")
    return {
      status: "error",
      message:
        res.ok
          ? "The Rust Playground sent an unexpected response. Try again later."
          : res.status >= 500
            ? "The Rust Playground is having trouble right now. Try again later."
            : `The Rust Playground rejected the request${body?.error ? `: ${body.error}` : ` (HTTP ${res.status}).`}`,
    };
  return { status: "done", ...body };
}

export function RustCodeActions({
  code,
  mode,
}: {
  code: string;
  mode?: "main" | "wrap";
}) {
  const [result, setResult] = useState<Result | null>(null);
  const controller = useRef<AbortController | null>(null);
  const wrapped = mode === "wrap" || (!mode && !hasMain(code));
  const source = wrapped ? wrapInMain(code) : code;
  const link = `https://play.rust-lang.org/?version=stable&mode=debug&edition=2024&code=${encodeURIComponent(source)}`;

  useEffect(() => () => controller.current?.abort(), []);

  async function run() {
    if (result?.status === "running") return;
    const current = (controller.current = new AbortController());
    setResult({ status: "running" });
    trackActivity("playground_run");
    const next = await execute(source, current.signal);
    if (!current.signal.aborted) setResult(next);
  }

  function close() {
    controller.current?.abort();
    setResult(null);
  }

  return (
    <>
      <div className="rust-actions">
        {mode && (
          <button
            type="button"
            onClick={run}
            aria-disabled={result?.status === "running"}
            className="rust-action-btn"
          >
            {result?.status === "running" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden />
            )}
            {result?.status === "running" ? "Running…" : result ? "Run again" : "Run"}
          </button>
        )}
        {link.length <= MAX_LINK_LENGTH && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="rust-action-btn"
            aria-label="Open in Rust Playground (opens in a new tab)"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Playground
          </a>
        )}
      </div>
      <div aria-live="polite">{result && <RunOutput result={result} wrapped={wrapped} onClose={close} />}</div>
    </>
  );
}

// Cargo prints build progress to stderr, then "Running `target/debug/playground`", then the program's own stderr.
function splitStderr(stderr: string) {
  const [build, program] = stderr.split(/^\s*Running `target\/debug\/playground`\n/m);
  return { build: build.trimEnd(), program: program?.replace(/^\n+/, "") ?? "", compiled: program !== undefined };
}

function RunOutput({ result, wrapped, onClose }: { result: Result; wrapped: boolean; onClose: () => void }) {
  const out = result.status === "done" ? { ...result, ...splitStderr(result.stderr) } : null;
  return (
    <div className="rust-output">
      <div className="rust-output-header">
        {result.status === "running" && <span>Running on play.rust-lang.org…</span>}
        {result.status === "error" && <span className="rust-output-fail">{result.message}</span>}
        {out?.success && (
          <span className="rust-output-ok">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Ran successfully
          </span>
        )}
        {out && !out.success && (
          <span className="rust-output-fail">
            <CircleX className="h-3.5 w-3.5" aria-hidden />{" "}
            {out.compiled ? out.exitDetail || "Failed" : "Didn't compile"}
          </span>
        )}
        {wrapped && result.status !== "error" && <span className="rust-output-note">wrapped in fn main()</span>}
        <button type="button" onClick={onClose} className="rust-output-close" aria-label="Close output">
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {out && (
        <>
          {out.stdout && <pre className="rust-output-stream">{out.stdout}</pre>}
          {out.program && <pre className="rust-output-stream rust-output-stderr">{out.program}</pre>}
          {out.success && !out.stdout && !out.program && <p className="rust-output-empty">No output.</p>}
          <details open={!out.compiled}>
            <summary>Compiler output</summary>
            <pre className="rust-output-stream">{out.build}</pre>
          </details>
        </>
      )}
    </div>
  );
}
