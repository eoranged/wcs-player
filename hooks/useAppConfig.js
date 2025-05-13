import { useState, useEffect } from 'react';

export function useAppConfig(telegramUser) {
  const [config, setConfig] = useState({
    isAdmin: false,
    features: {
      debugPanel: process.env.NODE_ENV === 'development' // Default to true in development
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch config if we have user data
    if (!telegramUser) {
      setLoading(false);
      return;
    }

    async function fetchConfig() {
      try {
        // Get Telegram environment info
        const telegramEnv = typeof window !== 'undefined' && window.Telegram?.WebApp 
          ? {
              platform: window.Telegram.WebApp.platform,
              version: window.Telegram.WebApp.version,
              colorScheme: window.Telegram.WebApp.colorScheme
            }
          : null;

        // Prepare request body
        const requestBody = {
          user: telegramUser,
          env: telegramEnv
        };

        // Fetch configuration from API
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`Config API error: ${response.status}`);
        }

        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Error fetching app config:', error);
        // Keep default config on error
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [telegramUser]);

  return { config, loading };
}
