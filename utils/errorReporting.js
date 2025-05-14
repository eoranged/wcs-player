import * as Sentry from '@sentry/nextjs';

/**
 * Utility function to capture errors with Sentry
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context to include with the error
 * @param {string} level - The severity level (fatal, error, warning, info, debug)
 */
export const captureError = (error, context = {}, level = 'error') => {
  // Check if Sentry is initialized
  if (typeof Sentry.captureException === 'function') {
    // Add additional context
    Sentry.configureScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    });

    // Capture the exception with the appropriate level
    if (level === 'fatal' || level === 'error') {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(error.message || String(error), level);
    }
    
    console.error(`Error captured by Sentry (${level}):`, error);
  } else {
    // Fallback to console if Sentry is not available
    console.error('Error (Sentry not initialized):', error);
  }
};

/**
 * Utility function to set user information in Sentry
 * @param {Object} user - User information
 */
export const setUserContext = (user) => {
  if (typeof Sentry.setUser === 'function' && user) {
    Sentry.setUser({
      id: user.id,
      username: user.username || undefined,
      // Don't include personal information like name or email
    });
    console.log('Sentry user context set');
  }
};

/**
 * Check if Sentry is initialized
 * @returns {boolean} - Whether Sentry is initialized
 */
export const isSentryInitialized = () => {
  return typeof Sentry.captureException === 'function';
};

export default {
  captureError,
  setUserContext,
  isSentryInitialized,
};
