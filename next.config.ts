import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable standalone output so Electron can run the Next server in production
  output: "standalone",
  // Do not block builds on ESLint issues; we lint separately
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure Next traces from this project, avoiding the multi-lockfile warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
