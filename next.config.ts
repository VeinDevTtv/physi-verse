import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output so Electron can run the Next server in production
  output: "standalone",
};

export default nextConfig;
