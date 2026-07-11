import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Keepsake archive route compiles Tailwind at runtime against the
  // rendered page HTML. Bundling tailwindcss into the route strips the
  // css assets it reads from disk (preflight.css), so it must stay
  // external and resolve from node_modules.
  serverExternalPackages: ["tailwindcss", "postcss", "autoprefixer"],
  // Serve legacy static portfolio at /sihas-abeywickrama — a publicly
  // shared URL that predates the pages platform. Files live in
  // public/legacy/sihas-abeywickrama/.
  async rewrites() {
    return [
      {
        source: "/sihas-abeywickrama",
        destination: "/legacy/sihas-abeywickrama/index.html",
      },
      {
        source: "/sihas-abeywickrama/:path+",
        destination: "/legacy/sihas-abeywickrama/:path+",
      },
    ];
  },
  // Portfolio-era dashboard routes replaced by the pages platform.
  async redirects() {
    return [
      { source: "/dashboard/portfolio", destination: "/dashboard", permanent: false },
      { source: "/dashboard/settings", destination: "/settings/profile", permanent: false },
    ];
  },
};

export default nextConfig;
