import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Static export — no trailing slash redirect needed
  trailingSlash: true,
};

export default nextConfig;