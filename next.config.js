// Updated config with fixed experimental flag
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  // Optional: Configure image domains if needed
  images: {
    domains: [],
  },
  // Remove the serverActions flag as it's now default in Next.js 14
  experimental: {
    // serverActions: true, // This was causing the warning
  },
};

module.exports = nextConfig;
