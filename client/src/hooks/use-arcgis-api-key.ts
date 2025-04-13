import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing ArcGIS API key
 * 
 * This hook provides a way to get and manage an ArcGIS API key from various sources:
 * 1. Cache (in-memory during session)
 * 2. LocalStorage
 * 3. Environment variables
 * 4. Server API endpoint
 * 
 * @returns The ArcGIS API key, loading state, and error state
 */
export function useArcgisApiKey() {
  // State for the ArcGIS API key
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Get the ArcGIS API key
   */
  const getApiKey = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check localStorage first for fast loading
      const storedKey = localStorage.getItem('arcgis_api_key');
      if (storedKey) {
        console.log('Using ArcGIS API key from localStorage');
        setApiKey(storedKey);
        setIsLoading(false);
        return storedKey;
      }
      
      // Check environment variables
      try {
        // Try different ways to access environment variables
        const envKey = (window as any).ENV?.ARCGIS_API_KEY || 
                       (window as any).VITE_ARCGIS_API_KEY ||
                       (window as any).ARCGIS_API_KEY;
                         
        if (envKey) {
          console.log('Using ArcGIS API key from environment variables');
          setApiKey(envKey);
          
          // Store in localStorage for future use
          try {
            localStorage.setItem('arcgis_api_key', envKey);
          } catch (storageError) {
            console.warn('Could not store API key in localStorage:', storageError);
          }
          
          setIsLoading(false);
          return envKey;
        }
      } catch (envErr) {
        console.warn('Error accessing environment variables:', envErr);
      }
      
      // If no key is found locally, fetch from the server
      console.log('Fetching ArcGIS API key from server...');
      const apiBaseUrl = location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      
      // Try the primary endpoint
      const response = await fetch(`${apiBaseUrl}/api/map-services/arcgis-api-key`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ArcGIS API key: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && data.apiKey) {
        console.log('Successfully retrieved ArcGIS API key from server');
        setApiKey(data.apiKey);
        
        // Store in localStorage for future use
        try {
          localStorage.setItem('arcgis_api_key', data.apiKey);
        } catch (storageError) {
          console.warn('Could not store API key in localStorage:', storageError);
        }
        
        setIsLoading(false);
        return data.apiKey;
      } else if (data && data.error) {
        throw new Error(`API returned error: ${data.error.message}`);
      } else {
        throw new Error('No valid API key found in response');
      }
    } catch (error) {
      console.error('Error fetching ArcGIS API key:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsLoading(false);
      return '';
    }
  }, []);
  
  // Fetch API key on component mount
  useEffect(() => {
    getApiKey();
  }, [getApiKey]);
  
  // Function to manually refresh the API key
  const refreshApiKey = useCallback(async () => {
    return getApiKey();
  }, [getApiKey]);
  
  // Function to clear the API key from storage
  const clearApiKey = useCallback(() => {
    try {
      localStorage.removeItem('arcgis_api_key');
      setApiKey('');
    } catch (error) {
      console.error('Error clearing ArcGIS API key:', error);
    }
  }, []);
  
  return {
    apiKey,
    isLoading,
    error,
    refreshApiKey,
    clearApiKey
  };
}