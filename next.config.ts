import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
