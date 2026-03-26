"use client";

import { useEffect, useRef, useState, useId, useCallback } from "react";
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const id = useId().replace(/:/g, "m");

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        fontFamily: "inherit",
        securityLevel: "loose",
      });

      mermaid
        .render(`mermaid-${id}`, chart)
        .then(({ svg: rendered }) => {
          if (!cancelled) setSvg(rendered);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    });

    return () => { cancelled = true; };
  }, [chart, id]);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const openFullscreen = useCallback(() => {
    resetView();
    setFullscreen(true);
  }, [resetView]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(Math.max(0.25, s - e.deltaY * 0.001), 4));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: translate.x, ty: translate.y };
  }, [translate]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTranslate({
      x: dragRef.current.tx + e.clientX - dragRef.current.startX,
      y: dragRef.current.ty + e.clientY - dragRef.current.startY,
    });
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  if (error) {
    return (
      <div className="pre-wrapper">
        <pre><code>{chart}</code></pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading diagram...
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="group/mermaid relative my-6"
      >
        <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover/mermaid:opacity-100 max-lg:opacity-100 transition-opacity">
          <button
            onClick={openFullscreen}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="View fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </button>
        </div>
        <div
          className="mermaid-diagram flex justify-center overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium">Diagram</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(s - 0.25, 0.25))}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={resetView}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Reset view"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setFullscreen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors ml-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div
              className="mermaid-diagram h-full w-full flex items-center justify-center"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: dragRef.current ? "none" : "transform 0.15s ease",
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
