import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve legacy static portfolio at /sihas-abeywickrama
  // Files live in public/legacy/sihas-abeywickrama/
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
};

export default nextConfig;
