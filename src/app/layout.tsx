import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

/**
 * Save7's two official typefaces. Anton is loaded as a display face only — see
 * globals.css, where it is scoped to .font-display so it can never leak into
 * body copy, which the brand kit explicitly forbids.
 */
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Transplant Alchemy 101 · Save7",
    template: "%s · Transplant Alchemy 101",
  },
  description:
    "Save7's organ donation and transplantation awareness course. Learn enough to confidently start the conversation.",
  applicationName: "Transplant Alchemy 101",
  authors: [{ name: "Save7", url: "https://save7.org" }],
  openGraph: {
    title: "Transplant Alchemy 101 · Save7",
    description:
      "A three-level learning pathway on organ donation and transplantation in South Africa.",
    siteName: "Save7",
    locale: "en_ZA",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ed0e69",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${anton.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-sand-50 text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
