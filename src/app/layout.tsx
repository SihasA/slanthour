import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmMono.variable}`}>
      <body className="bg-background text-foreground font-body font-light">
        {children}
      </body>
    </html>
  );
}
