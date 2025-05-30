import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing Mapbox token
 * 
 * This hook provides a way to get and manage a Mapbox token from various sources:
 * 1. Cache (in-memory during session)
 * 2. LocalStorage 
 * 3. Environment variables
 * 4. Server API endpoint
 * 
 * @returns The Mapbox token, loading state, and error state
 */
export function useMapboxToken() {
  // State for the Mapbox token
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Get the Mapbox token
   */
  const getToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get from localStorage first (for fast loading)
      try {
        const localToken = localStorage.getItem('mapbox_token');
        if (localToken) {
          console.log('Found Mapbox token in localStorage');
          setToken(localToken);
          setIsLoading(false);
          return localToken;
        }
      } catch (err) {
        console.warn('Error accessing localStorage:', err);
      }
      
      // Then try environment variable
      try {
        const envToken = (window as any).ENV?.MAPBOX_ACCESS_TOKEN || 
                         (window as any).MAPBOX_ACCESS_TOKEN;
                         
        if (envToken) {
          console.log('Using Mapbox token from environment variables');
          setToken(envToken);
          try {
            localStorage.setItem('mapbox_token', envToken);
          } catch (storageErr) {
            console.warn('Could not store token in localStorage:', storageErr);
          }
          setIsLoading(false);
          return envToken;
        }
      } catch (envErr) {
        console.warn('Error accessing environment variables:', envErr);
      }
      
      // If both failed, fetch from API
      console.log('Fetching Mapbox token from API endpoint');
      try {
        // Try the primary endpoint first
        const primaryResponse = await fetch('/api/map-services/mapbox-token', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (primaryResponse.ok) {
          const primaryData = await primaryResponse.json();
          if (primaryData && typeof primaryData.token === 'string') {
            console.log('Successfully retrieved Mapbox token from primary endpoint');
            setToken(primaryData.token);
            try {
              localStorage.setItem('mapbox_token', primaryData.token);
            } catch (storageErr) {
              console.warn('Could not store token in localStorage:', storageErr);
            }
            setIsLoading(false);
            return primaryData.token;
          }
        }
      } catch (primaryErr) {
        console.warn('Primary endpoint failed:', primaryErr);
      }
      
      // If primary endpoint fails, try fallback endpoint
      console.log('Trying fallback endpoint: /api/mapbox-token');
      const fallbackResponse = await fetch('/api/mapbox-token', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`Failed to fetch Mapbox token: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData && typeof fallbackData.token === 'string') {
        console.log('Successfully retrieved Mapbox token from fallback endpoint');
        setToken(fallbackData.token);
        try {
          localStorage.setItem('mapbox_token', fallbackData.token);
        } catch (storageErr) {
          console.warn('Could not store token in localStorage:', storageErr);
        }
        setIsLoading(false);
        return fallbackData.token;
      } else {
        throw new Error('No token found in API response');
      }
    } catch (error) {
      console.error('Error fetching Mapbox token:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsLoading(false);
      return '';
    }
  }, []);
  
  // Fetch token on component mount
  useEffect(() => {
    getToken();
  }, [getToken]);
  
  // Function to manually refresh the token
  const refreshToken = useCallback(async () => {
    return getToken();
  }, [getToken]);
  
  // Function to clear the token from storage
  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem('mapbox_token');
      setToken('');
    } catch (error) {
      console.error('Error clearing Mapbox token:', error);
    }
  }, []);
  
  return {
    token,
    isLoading,
    error,
    refreshToken,
    clearToken
  };
}