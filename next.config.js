/** @type {import('next').NextConfig} */

// Base configuration
const baseConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  basePath: '',
  trailingSlash: true,
};

// Development configuration
const devConfig = {
  ...baseConfig,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

// Production configuration
const prodConfig = {
  ...baseConfig,
  output: 'export',
  distDir: 'out',
  skipTrailingSlashRedirect: true,
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
    };
  },
};

// Use different config based on environment
module.exports = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
