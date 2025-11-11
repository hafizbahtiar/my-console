import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Security headers are handled in middleware.ts
  // This ensures headers are applied to all routes including static assets

  // Request size limits
  // Limit request body size to prevent DoS attacks
  // Default is 1MB, we'll set it to 10MB for file uploads/imports
  // Individual API routes can enforce stricter limits
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
