import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Build & linting
   * (OK for development — NOT recommended for production)
   */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * Image domains
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },

  /**
   * Server Actions
   */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  /**
   * Webpack fixes for browser builds
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        async_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
