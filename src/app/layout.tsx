import type { Metadata, Viewport } from "next";
import { Lexend, Montserrat } from "next/font/google";
import "./globals.css";

/**
 * Learn's two typefaces (#68): Montserrat for headings, Lexend for body and UI.
 * Montserrat is loaded at 700 and 800 only, the two weights the type scale uses.
 */
const montserrat = Montserrat({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Save7 Learn",
    template: "%s · Save7 Learn",
  },
  description:
    "Save7's organ donation and transplantation awareness course. Learn enough to confidently start the conversation.",
  applicationName: "Save7 Learn",
  authors: [{ name: "Save7", url: "https://save7.org" }],
  openGraph: {
    title: "Save7 Learn",
    description:
      "A three-level learning pathway on organ donation and transplantation in South Africa.",
    siteName: "Save7",
    locale: "en_ZA",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${montserrat.variable} ${lexend.variable}`}>
      <body className="min-h-dvh bg-white text-navy antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
