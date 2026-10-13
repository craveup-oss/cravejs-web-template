import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  // Local preview only: use the same-origin API topology as the combined image.
  // This checkout-local override is excluded from the release source snapshot.
  async rewrites() {
    return process.env.NODE_ENV === "development" ? [{
      source: "/api/v1/storefront/:path*",
      destination: "https://my-restaurant.develop.craveup.com/api/v1/storefront/:path*",
    }] : [];
  },
  // Asset permission is request/tenant-owned through the runtime CSP. Do not
  // expose a server image proxy with a wildcard host allowlist in a shared image.
  images: { unoptimized: true },
};

export default nextConfig;
