import type { NextConfig } from "next";

console.log("Loading next.config.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "backend",
        port: "5000",
      },
    ],
  },
  async rewrites() {
    console.log("Setting up rewrites");
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:5000/api/:path*', // Proxy to backend
      },
    ];
  },
};

export default nextConfig;