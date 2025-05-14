// This file is used to initialize Sentry in Next.js 15
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only initialize on the server
    const Sentry = await import('@sentry/nextjs');
    const { ProfilingIntegration } = await import('@sentry/profiling-node');
    
    const SENTRY_DSN = process.env.SENTRY_DSN;
    
    if (SENTRY_DSN) {
      console.log('Initializing Sentry in instrumentation...');
      Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 1.0,
        debug: false,
        environment: process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
        integrations: [
          // Enable server profiling integration for Next.js 15
          new ProfilingIntegration(),
        ],
      });
    }
  }
}
