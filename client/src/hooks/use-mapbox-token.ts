import { useState, useEffect } from 'react';
import { getMapboxToken, getMapboxTokenAsync } from '@/lib/env';

/**
 * Hook to get and manage Mapbox access token
 * 
 * This hook will:
 * 1. Try to get the token from environment variables first
 * 2. If not available, fetch from API endpoint
 * 3. Manage loading and error states
 */
export function useMapboxToken() {
  const [token, setToken] = useState<string>(getMapboxToken());
  const [isLoading, setIsLoading] = useState<boolean>(token === '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      if (token) return; // Already have token
      
      setIsLoading(true);
      setError(null);
      
      try {
        const fetchedToken = await getMapboxTokenAsync();
        if (fetchedToken) {
          setToken(fetchedToken);
        } else {
          setError('Could not retrieve Mapbox token');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error fetching Mapbox token');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!token) {
      fetchToken();
    }
  }, [token]);

  return { token, isLoading, error };
}

export default useMapboxToken;