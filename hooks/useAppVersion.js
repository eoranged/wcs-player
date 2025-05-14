import { useState, useEffect } from 'react';

export function useAppVersion() {
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get version from environment variable
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
    setVersion(appVersion);
    setLoading(false);
  }, []);

  return { version, loading, error };
}
