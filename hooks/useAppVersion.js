import { useState, useEffect } from 'react';

export function useAppVersion() {
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVersion() {
      try {
        // Add a cache-busting parameter to avoid caching issues
        const response = await fetch(`/version.json?_=${new Date().getTime()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch version: ${response.status}`);
        }
        
        const data = await response.json();
        setVersion(data.version);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching version:', err);
        setError(err.message);
        setLoading(false);
        // Fallback to 'dev' version if we can't fetch the version
        setVersion('dev');
      }
    }

    fetchVersion();
  }, []);

  return { version, loading, error };
}
