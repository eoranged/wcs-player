// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  console.log('Initializing Sentry client-side...');
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    environment: process.env.NODE_ENV,
    // Optional: Set a release version
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
    // Browser-specific integrations
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        // This sets the sample rate to be 10% for normal sessions
        sessionSampleRate: 0.1,
        // If the entire session is not sampled, use the below sample rate to sample
        // sessions when an error occurs.
        errorSampleRate: 1.0,
      }),
    ],
  });
  console.log('Sentry client-side initialized successfully');
} else {
  console.log('Sentry client-side initialization skipped: No DSN provided');
}
