// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  // Optional: Configure image domains if needed
  images: {
    domains: [],
  },
  // Enable experimental serverActions if using newer Next.js features
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
