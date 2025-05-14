/** @type {import('next').NextConfig} */

// Import the Sentry webpack plugin and i18n config
const { withSentryConfig } = require('@sentry/nextjs');
const { i18n } = require('./next-i18next.config.js');

// Base configuration
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  basePath: '',
  trailingSlash: true,
  i18n,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Suppress critical dependency warnings
    config.ignoreWarnings = [
      { module: /@opentelemetry/ },
      { module: /@prisma\/instrumentation/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ];
    return config;
  },
};

// Sentry configuration for Next.js
const sentryWebpackPluginOptions = {
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  
  // Prevents the Sentry plugin from creating source maps
  // This helps avoid the critical dependency warnings
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
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
