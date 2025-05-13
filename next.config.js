/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static exports
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Set base path if your app is not served from the root
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  // Ensure static files are properly cached
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Handle API routes in development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*',
        },
      ];
    }
    return [];
  },
  // Disable server-side rendering for static export
  distDir: 'out',
  // Disable the default static export behavior for API routes
  skipTrailingSlashRedirect: true,
  // Disable the default static export behavior for 404 page
  skipMissingStaticPaths: true,
};

module.exports = nextConfig;
