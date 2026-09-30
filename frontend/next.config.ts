import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the slim Docker runtime image
  output: 'standalone',
}

export default nextConfig;
