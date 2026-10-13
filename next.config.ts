import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  // Asset permission is request/tenant-owned through the runtime CSP. Do not
  // expose a server image proxy with a wildcard host allowlist in a shared image.
  images: { unoptimized: true },
};

export default nextConfig;
