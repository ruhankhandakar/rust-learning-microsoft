import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Inter, Lora, Merriweather, JetBrains_Mono, Kode_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressProvider } from "@/components/progress-provider";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { FontProvider } from "@/components/font-provider";
import { BookmarkProvider } from "@/components/bookmark-provider";
import { SessionProvider } from "@/components/session-provider";
import { LearnerSync } from "@/components/learner-sync";
import { StarPrompt } from "@/components/star-prompt";
import { PageViewCounter } from "@/components/page-view-counter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kodeMono = Kode_Mono({
  variable: "--font-kode-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rust.learningz.xyz"),
  title: {
    default: "Rust Training — Learn Rust with Microsoft's Free Rust Books",
    template: "%s | Rust Training",
  },
  description:
    "An unofficial, free reader for Microsoft's open-source RustTraining books and 100 Rust Projects, built by Ruhan Khandakar. Learn Rust from beginner to advanced with progress tracking, bookmarks, search and offline reading.",
  applicationName: "Rust Training",
  alternates: {
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "Rust Training: what changed" }] },
  },
  authors: [{ name: "Ruhan Khandakar" }],
  creator: "Ruhan Khandakar",
  publisher: "Ruhan Khandakar",
  keywords: [
    "Rust",
    "Rust programming",
    "learn Rust",
    "Rust tutorial",
    "Rust book",
    "Ruhan Khandakar",
    "systems programming",
    "Rust beginner",
    "Rust training",
  ],
  openGraph: {
    type: "website",
    title: "Rust Training — Learn Rust with Microsoft's Free Rust Books",
    description:
      "An unofficial, free reader for Microsoft's open-source RustTraining books. Learn Rust from beginner to advanced with progress tracking and bookmarks.",
    siteName: "Rust Training",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rust Training",
    description:
      "Free Rust books from Microsoft's RustTraining, in an unofficial reader with progress tracking and offline mode.",
    creator: "@KhandakarRuhan",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rust Training",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${kodeMono.variable} ${inter.variable} ${lora.variable} ${merriweather.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"){document.documentElement.classList.add("dark")}var f=localStorage.getItem("reading-font");if(f)document.documentElement.setAttribute("data-font",f);var s=localStorage.getItem("reading-font-size");if(s)document.documentElement.setAttribute("data-font-size",s)}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Rust Training",
              description:
                "An unofficial, free reader for Microsoft's open-source RustTraining books. Learn Rust from beginner to advanced.",
              url: "https://rust.learningz.xyz",
              author: {
                "@type": "Person",
                name: "Ruhan Khandakar",
                url: "https://x.com/KhandakarRuhan",
                sameAs: [
                  "https://x.com/KhandakarRuhan",
                  "https://github.com/ruhankhandakar",
                ],
              },
              publisher: {
                "@type": "Person",
                name: "Ruhan Khandakar",
              },
              inLanguage: "en-US",
            }),
          }}
        />
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            type="module"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })}
          />
        )}
        <SessionProvider>
          <ThemeProvider>
            <FontProvider>
              <ProgressProvider>
                <BookmarkProvider>
                  {children}
                  <OfflineIndicator />
                  <ServiceWorkerRegister />
                  <StarPrompt />
                  <LearnerSync />
                  <PageViewCounter />
                </BookmarkProvider>
              </ProgressProvider>
            </FontProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
