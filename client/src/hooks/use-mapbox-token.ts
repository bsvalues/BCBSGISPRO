import { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useQuery } from '@tanstack/react-query';
import { getMapboxToken, getMapboxTokenAsync } from '@/lib/env';

/**
 * Hook to get and manage Mapbox access token
 * 
 * This hook will:
 * 1. Try to get the token from local storage first
 * 2. If not available, fetch from API endpoint
 * 3. Manage loading and error states
 */
export function useMapboxToken() {
  const [localToken, setLocalToken] = useState<string | null>(null);

  // Try to get token using the env utility first (checks env vars, localStorage, etc)
  useEffect(() => {
    try {
      // First check for direct token using sync method
      const directToken = getMapboxToken();
      
      if (directToken) {
        console.log('Found Mapbox token from environment or localStorage');
        setLocalToken(directToken);
        mapboxgl.accessToken = directToken;
      } else {
        // No token found in immediate sources
        console.log('VITE_MAPBOX_ACCESS_TOKEN not available, trying API endpoint');
        
        // Try async method which includes API fetch
        getMapboxTokenAsync()
          .then(apiToken => {
            if (apiToken) {
              console.log('Retrieved Mapbox token from API');
              setLocalToken(apiToken);
              mapboxgl.accessToken = apiToken;
            }
          })
          .catch(err => {
            console.error('Error initializing Mapbox:', err);
          });
      }
    } catch (err) {
      console.warn('Error accessing token sources:', err);
    }
  }, []);

  // Fetch token from API if not found in localStorage
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      console.log('Fetching Mapbox token from API...');
      try {
        const response = await fetch('/api/mapbox-token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch Mapbox token:', errorText);
          throw new Error(`API response not OK: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.token) {
          console.error('Mapbox token not found in API response');
          throw new Error('Mapbox token not found in API response');
        }
        
        console.log('Successfully retrieved Mapbox token from API');
        return data.token;
      } catch (err) {
        console.error('Error in Mapbox token fetch:', err);
        throw err;
      }
    },
    enabled: !localToken, // Only run query if we don't have a token from localStorage
    retry: 3,
    retryDelay: 1000,
    onSuccess: (token) => {
      console.log('Setting Mapbox token from API response');
      
      // Set the token in mapboxgl directly
      mapboxgl.accessToken = token;
      
      // Store in localStorage for future use
      try {
        localStorage.setItem('mapbox_token', token);
      } catch (err) {
        console.warn('Could not store Mapbox token in localStorage:', err);
      }
      
      setLocalToken(token);
    },
    onError: (err) => {
      console.error('Error fetching Mapbox token:', err);
    },
  });

  // The token to return is either from localStorage or the API
  const token = localToken || data || '';

  // Set token globally when it changes
  useEffect(() => {
    if (token) {
      console.log('Setting global Mapbox token');
      mapboxgl.accessToken = token;
    }
  }, [token]);

  return { 
    token, 
    isLoading, 
    error: isError ? error : null 
  };
}

export default useMapboxToken;