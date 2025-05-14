// This file configures the initialization of Sentry for edge runtimes
// The config you add here will be used whenever your application gets used in an edge runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  console.log('Initializing Sentry edge runtime...');
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    environment: process.env.NODE_ENV,
    // Optional: Set a release version
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  });
  console.log('Sentry edge runtime initialized successfully');
} else {
  console.log('Sentry edge runtime initialization skipped: No DSN provided');
}
