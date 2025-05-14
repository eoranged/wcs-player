// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  console.log('Initializing Sentry server-side...');
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    environment: process.env.NODE_ENV,
    // Optional: Set a release version
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
    integrations: [
      // Enable server profiling integration for Next.js 15
      new ProfilingIntegration(),
    ],
  });
  console.log('Sentry server-side initialized successfully');
} else {
  console.log('Sentry server-side initialization skipped: No DSN provided');
}
