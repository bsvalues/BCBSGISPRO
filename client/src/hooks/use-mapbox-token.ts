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
  const initialToken = getMapboxToken();
  const [token, setToken] = useState<string>(initialToken);
  const [isLoading, setIsLoading] = useState<boolean>(initialToken === '');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    async function fetchToken() {
      if (token) return; // Already have token
      
      // Skip if we've reached max retries
      if (retryCount >= MAX_RETRIES) {
        setError(`Failed to get Mapbox token after ${MAX_RETRIES} attempts`);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Attempting to fetch Mapbox token (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        const fetchedToken = await getMapboxTokenAsync();
        
        if (fetchedToken) {
          console.log('Successfully retrieved Mapbox token');
          setToken(fetchedToken);
        } else {
          throw new Error('Empty token returned from API');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching Mapbox token');
        // Increment retry count and try again after a delay
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000); // 1 second delay between retries
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!token) {
      fetchToken();
    }
  }, [token, retryCount]);

  return { token, isLoading, error };
}

export default useMapboxToken;