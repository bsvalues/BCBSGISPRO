import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get and manage ArcGIS API key
 * 
 * This hook will:
 * 1. Try to get the key from local storage first
 * 2. If not available, fetch from API endpoint
 * 3. Manage loading and error states
 */
export function useArcgisApiKey() {
  const [localKey, setLocalKey] = useState<string | null>(null);

  // Try to get key from localStorage
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem('arcgis_api_key');
      if (storedKey) {
        console.log('Found ArcGIS API key in localStorage');
        setLocalKey(storedKey);
      } else {
        console.log('No ArcGIS API key found in localStorage');
      }
    } catch (err) {
      console.warn('Error accessing token sources:', err);
    }
  }, []);

  // Fetch key from API if not found in localStorage
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['arcgis-api-key'],
    queryFn: async () => {
      console.log('Fetching ArcGIS API key from API...');
      try {
        const apiBaseUrl = '';
        
        const response = await fetch(`${apiBaseUrl}/api/map-services/arcgis-api-key`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ArcGIS API key: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data && typeof data.apiKey === 'string') {
          console.log('Successfully retrieved ArcGIS API key');
          
          // Store in localStorage for future use
          try {
            localStorage.setItem('arcgis_api_key', data.apiKey);
          } catch (storageError) {
            console.warn('Could not store ArcGIS API key in localStorage:', storageError);
          }
          
          return data.apiKey;
        } else {
          throw new Error('Invalid API key response');
        }
      } catch (err) {
        console.error('Error fetching ArcGIS API key:', err);
        throw err;
      }
    },
    enabled: !localKey && typeof window !== 'undefined', // Only run if no local key and in browser
    retry: 1, // Only retry once to avoid excessive requests
    staleTime: 24 * 60 * 60 * 1000, // Consider the key fresh for 24 hours
  });

  // Log errors for debugging
  useEffect(() => {
    if (isError) {
      console.error('Error fetching ArcGIS API key:', error);
    }
  }, [isError, error]);

  // The key to return is either from localStorage or the API
  const apiKey = localKey || data || '';

  return { 
    apiKey, 
    isLoading, 
    error: isError ? error : null 
  };
}

export default useArcgisApiKey;