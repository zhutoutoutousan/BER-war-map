/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: []
  },
  // Large map bundle + webpack pack cache can OOM on Windows dev machines.
  experimental: {
    webpackMemoryOptimizations: true
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }]
      }
    ];
  }
};

export default nextConfig;

