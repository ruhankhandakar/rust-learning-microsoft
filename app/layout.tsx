import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Lora, Merriweather, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ProgressProvider } from "@/components/progress-provider";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { FontProvider } from "@/components/font-provider";
import { BookmarkProvider } from "@/components/bookmark-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  title: "Rust Training — Microsoft",
  description:
    "A collection of free Rust training books for developers from every background.",
  applicationName: "Rust Training",
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
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${lora.variable} ${merriweather.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"){document.documentElement.classList.add("dark")}var f=localStorage.getItem("reading-font");if(f)document.documentElement.setAttribute("data-font",f);var s=localStorage.getItem("reading-font-size");if(s)document.documentElement.setAttribute("data-font-size",s)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <FontProvider>
          <ProgressProvider>
          <BookmarkProvider>
            {children}
            <SpeedInsights />
            <Analytics />
            <OfflineIndicator />
            <ServiceWorkerRegister />
          </BookmarkProvider>
          </ProgressProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
