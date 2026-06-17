import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Retired pages (no longer part of the business model). 301 so already
      // indexed/inbound links don't 404 and any link equity is preserved.
      { source: "/ecommerce", destination: "/", permanent: true },
      { source: "/automation", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
