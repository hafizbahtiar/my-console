import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Security headers are handled in middleware.ts
  // This ensures headers are applied to all routes including static assets
};

export default nextConfig;
