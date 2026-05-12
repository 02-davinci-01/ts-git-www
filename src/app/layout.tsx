import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ts_git — a git implementation in TypeScript",
  description:
    "A minimal version control system written from scratch in TypeScript. Explore branches, commits, and merges interactively.",
  keywords: [
    "git",
    "typescript",
    "version control",
    "git internals",
    "git implementation",
    "interactive",
  ],
  authors: [{ name: "the divine hermit" }],
  openGraph: {
    title: "ts_git — a git implementation in TypeScript",
    description:
      "A minimal version control system written from scratch in TypeScript. Explore branches, commits, and merges interactively.",
    type: "website",
    locale: "en_US",
    siteName: "ts_git",
  },
  twitter: {
    card: "summary",
    title: "ts_git — a git implementation in TypeScript",
    description:
      "A minimal version control system written from scratch in TypeScript. Explore branches, commits, and merges interactively.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-mono">{children}</body>
    </html>
  );
}
