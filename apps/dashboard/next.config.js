/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'standalone', // disabled — causes MODULE_NOT_FOUND on this VPS
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // Disable webpack cache to prevent corruption
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

module.exports = nextConfig
