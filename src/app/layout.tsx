import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  DM_Mono,
  Libre_Baskerville,
  Inter,
  Space_Grotesk,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";

// ─── Editorial fonts ─────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-dm-mono",
  display: "swap",
});

// ─── Journal fonts ───────────────────────────────────────────
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
});

// ─── Cinematic fonts ─────────────────────────────────────────
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slant Hour — A home for your best work",
  description:
    "A curated portfolio platform for photographers and visual creatives. No algorithm, no noise — just your best photographs, presented beautifully.",
  openGraph: {
    title: "Slant Hour",
    description:
      "A curated portfolio platform for photographers and visual creatives.",
    url: "https://slanthour.com",
    siteName: "Slant Hour",
    type: "website",
  },
};

const fontVars = [
  cormorant.variable,
  dmMono.variable,
  libreBaskerville.variable,
  inter.variable,
  spaceGrotesk.variable,
  ibmPlexMono.variable,
].join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVars}>
      <body className="bg-background text-foreground font-body font-light">
        {children}
      </body>
    </html>
  );
}
