import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Sora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iedchub.vercel.app";
const title = "IEDC Hub — Build. Innovate. Compete.";
const description =
  "Join Kerala's most active student innovation ecosystem. Participate in events, earn points, climb leaderboards, and build startups.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · IEDC Hub",
  },
  description,
  applicationName: "IEDC Hub",
  keywords: [
    "IEDC",
    "IEDC Hub",
    "IEDC IET",
    "student innovation",
    "hackathon",
    "startup",
    "Kerala",
    "events",
  ],
  authors: [{ name: "IEDC Hub" }],
  // src/app/icon.png and src/app/apple-icon.png are auto-detected by Next for
  // the favicon and Apple touch icon; declared here too for explicitness.
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "IEDC Hub",
    title,
    description,
    url: siteUrl,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "IEDC Hub — IEDC IET",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
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
      className={`${geistSans.variable} ${display.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
