/** @type {import('next').NextConfig} */

// Import the Sentry webpack plugin and i18n config
const { withSentryConfig } = require('@sentry/nextjs');
const { i18n } = require('./next-i18next.config.js');

// Base configuration
const baseConfig = {
  reactStrictMode: true,
  // swcMinify is now enabled by default in Next.js 15
  images: {
    unoptimized: true,
  },
  basePath: '',
  trailingSlash: true,
  i18n,
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
  // Next.js 15 recommended configuration
  skipTrailingSlashRedirect: true,
  // Use modern exportPathMap syntax
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
    };
  },
};

// Use different config based on environment
const nextConfig = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

// Sentry configuration for Next.js 15
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore
  silent: true, // Suppresses all logs
  // Next.js 15 specific options
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableServerWebpackPlugin: false,
  disableClientWebpackPlugin: false,
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
