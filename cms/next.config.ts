import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:8001");
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The CMS renders behind a browser-side session check, so only validate segments that opt in
    instantInsights: { validationLevel: "manual-warning" },
  },
  images: {
    // Media lives in backend/uploads and is served by the admin API host
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/uploads/**",
      },
    ],
    qualities: [75, 90],
    // The dev API runs on localhost, which Next blocks for optimization by default
    dangerouslyAllowLocalIP: isDev,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
