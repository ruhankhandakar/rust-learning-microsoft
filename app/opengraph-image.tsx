import { OG_SIZE, shareCard } from "@/lib/og";

export const alt = "Rust Training: learn Rust from Microsoft's free Rust books";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareCard({
    kicker: "Seven free Microsoft books and 100 projects",
    title: "Learn Rust, checked by rustc",
    footer: ["rust.learningz.xyz", "Free, unofficial"],
  });
}
