import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow external image URLs (e.g. logo configured via admin settings)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
