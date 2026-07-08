import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  DM_Mono,
  Libre_Baskerville,
  Inter,
  Space_Grotesk,
  IBM_Plex_Mono,
  Caveat,
  Fraunces,
  Archivo,
  Spectral,
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

// ─── Keepsake annotation font ────────────────────────────────
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-caveat",
  display: "swap",
});

// ─── Riviera display font ────────────────────────────────────
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// ─── Klaxon display font ─────────────────────────────────────
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-archivo",
  display: "swap",
});

// ─── Verdigris display font ──────────────────────────────────
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://slanthour.com"),
  title: "Slant Hour · A home for your best work",
  description:
    "A curated portfolio platform for photographers and visual creatives. No algorithm, no noise. Just your best photographs, presented beautifully.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Slant Hour",
    description:
      "A curated portfolio platform for photographers and visual creatives.",
    url: "https://slanthour.com",
    siteName: "Slant Hour",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Slant Hour",
    description:
      "A curated portfolio platform for photographers and visual creatives.",
    images: ["/og-image.png"],
  },
};

const fontVars = [
  cormorant.variable,
  dmMono.variable,
  libreBaskerville.variable,
  inter.variable,
  spaceGrotesk.variable,
  ibmPlexMono.variable,
  caveat.variable,
  fraunces.variable,
  archivo.variable,
  spectral.variable,
].join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    <html lang="en" className={fontVars}>
      <head>
        {/* Photographs are served from Supabase storage — pay DNS+TLS once,
            before the first <img> is discovered, not when it loads. */}
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />}
      </head>
      <body className="bg-background text-foreground font-body font-light">
        {children}
      </body>
    </html>
  );
}
