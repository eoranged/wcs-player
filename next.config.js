/** @type {import('next').NextConfig} */

// Import the Sentry webpack plugin
const { withSentryConfig } = require('@sentry/nextjs');

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
  // Removed 'output: export' to enable API routes in production
  skipTrailingSlashRedirect: true,
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
    };
  },
};

// Use different config based on environment
const nextConfig = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore
  silent: true, // Suppresses all logs
};

// Check if SENTRY_DSN is set
if (process.env.SENTRY_DSN) {
  console.log('Configuring Sentry in Next.js build...');
  module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
  console.log('Sentry configured in Next.js build successfully');
} else {
  console.log('Sentry configuration skipped: No DSN provided');
  module.exports = nextConfig;
}
