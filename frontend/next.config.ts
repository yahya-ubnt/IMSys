import type { NextConfig } from "next";

console.log("Loading next.config.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        // DEV-ONLY: Using localhost because the backend is on the host network.
        hostname: "localhost",
        port: "5000",
      },
    ],
  },
  async rewrites() {
    console.log("Setting up rewrites");
    return [
      {
        source: '/api/:path*',
        // DEV-ONLY: Proxy to localhost because the backend is on the host network.
        // In production, this is typically handled by a reverse proxy (e.g., Nginx).
        destination: 'http://backend:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;