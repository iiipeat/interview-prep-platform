/** @type {import('next').NextConfig} */
const nextConfig = {
  // No experimental appDir needed in Next.js 14 - App Router is stable
  
  // Safari compatibility settings
  compiler: {
    // Ensures proper CSS vendor prefixes
    styledComponents: true,
  },
  
  // Webpack configuration for better browser compatibility
  webpack: (config, { isServer }) => {
    // Add polyfills for Safari compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Headers for better Safari compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;