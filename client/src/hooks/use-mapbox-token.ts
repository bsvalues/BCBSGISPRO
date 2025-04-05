import { useState, useEffect } from 'react';
import { getMapboxToken, getMapboxTokenAsync } from '@/lib/env';
import mapboxgl from 'mapbox-gl';

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
        
        // Direct API fetch instead of using the utility function
        const response = await fetch('/api/mapbox-token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`API response not OK: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const fetchedToken = data.token;
        
        if (fetchedToken) {
          console.log('Successfully retrieved Mapbox token');
          
          // Set the token in mapboxgl directly
          mapboxgl.accessToken = fetchedToken;
          
          // Store in localStorage for future use
          try {
            localStorage.setItem('mapbox_token', fetchedToken);
          } catch (err) {
            console.warn('Could not store Mapbox token in localStorage:', err);
          }
          
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
    } else {
      // If we have a token, make sure it's set globally for mapbox-gl
      mapboxgl.accessToken = token;
    }
  }, [token, retryCount]);

  return { token, isLoading, error };
}

export default useMapboxToken;