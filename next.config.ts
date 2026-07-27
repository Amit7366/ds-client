import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for small production Docker images (standalone server.js)
  output: "standalone",
};

export default nextConfig;
