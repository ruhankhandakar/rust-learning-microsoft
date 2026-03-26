import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rust Training by Ruhan Khandakar",
    short_name: "Rust Training",
    description:
      "A curated collection of free Rust programming books and tutorials, built by Ruhan Khandakar. Learn Rust from beginner to advanced.",
    start_url: "/",
    display: "standalone",
    background_color: "#1a1a1a",
    theme_color: "#C45A2C",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
