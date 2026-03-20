import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0908",
        foreground: "#e8e4df",
        muted: "#9c9894",
        accent: "#FF6B00",
        rule: "#1f1e1d",
        surface: "#141312",
      },
      fontFamily: {
        heading: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-dm-mono)", "monospace"],
      },
      letterSpacing: {
        label: "0.25em",
        wide: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
