import type { NextConfig } from "next";

const gateway = process.env.API_GATEWAY_INTERNAL_URL || "http://api-gateway:8000";

const nextConfig: NextConfig = {
  // Required for the slim Docker runtime image
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${gateway}/:path*` }];
  },
};

export default nextConfig;
