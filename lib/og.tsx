import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

const ink = "#eef0f4";
const muted = "#a3a6ae";
const warm = "#f0b98f";
const page = "#15171c";

let assets: Promise<[Buffer, string]> | undefined;
function loadAssets() {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/KodeMono-Bold.ttf")),
    readFile(join(process.cwd(), "public/brand/icon.svg"), "utf-8").then((svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`),
  ]);
  return assets;
}

/** Shrinks a title until it fits on one line of the card (Kode Mono is about 0.6em per character). */
function titleSize(title: string, max: number): number {
  return Math.max(44, Math.min(max, Math.floor(1060 / (title.length * 0.6))));
}

export async function shareCard({
  kicker,
  title,
  tag,
  stats,
  footer,
  code,
  glow,
}: {
  kicker?: string;
  title: string;
  tag?: string;
  stats?: [string, string][];
  footer: [string, string];
  code?: string;
  glow?: boolean;
}) {
  const [font, logo] = await loadAssets();
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: ink,
          fontFamily: "Kode Mono",
          background: glow ? `radial-gradient(ellipse at 85% 20%, rgba(217,130,79,0.35), transparent 55%), ${page}` : page,
        }}
      >
        {code && (
          <div style={{ position: "absolute", right: -40, top: 40, display: "flex", flexDirection: "column", fontSize: 26, lineHeight: 1.6, color: "rgba(217,130,79,0.22)" }}>
            {code.split("\n").map((line, i) => (
              <span key={i} style={{ whiteSpace: "pre" }}>
                {line || " "}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser */}
          <img src={logo} width={52} height={52} alt="" />
          <span style={{ fontSize: 24 }}>Rust Training</span>
          {tag && <span style={{ marginLeft: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(84,196,130,0.18)", color: "#8fdcae", fontSize: 18 }}>{tag}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {kicker && <span style={{ fontSize: 26, color: glow ? warm : muted }}>{kicker}</span>}
          <span style={{ fontSize: titleSize(title, glow ? 64 : 70), lineHeight: 1.05, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>{title}</span>
        </div>
        {stats ? (
          <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
            {stats.map(([n, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 44 }}>{n}</span>
                <span style={{ fontSize: 20, color: muted }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 20, color: muted }}>
              <span>{footer[0]}</span>
              <span>{footer[1]}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 32, fontSize: 18, color: muted }}>
            <span>{footer[0]}</span>
            <span>{footer[1]}</span>
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Kode Mono", data: font, weight: 700, style: "normal" }] },
  );
}
