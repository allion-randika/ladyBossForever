import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash stock photography stands in for real product photography
    // until the business's own catalog shoot exists — see Phase 7 of the
    // plan. Swap this out once real images are hosted (R2/S3 per the plan).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
