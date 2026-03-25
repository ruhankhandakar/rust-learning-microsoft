import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rust Training — Microsoft",
    short_name: "Rust Training",
    description:
      "A collection of free Rust training books for developers from every background.",
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
