import { useState, useCallback, useEffect } from 'react';
import bentonArcGISClient, { ArcGISError, ArcGISErrorType } from '../services/benton-arcgis-client';
import { useToast } from './use-toast';

/**
 * Custom hook for using the Benton County ArcGIS client in React components
 */
export function useBentonArcGIS() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ArcGISError | null>(null);
  const { toast } = useToast();

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle errors consistently
  const handleError = useCallback((error: ArcGISError, operation: string) => {
    setError(error);
    
    // Show appropriate toast based on error type
    let title = 'Error';
    let description = 'Failed to fetch data from Benton County GIS services.';
    
    switch (error.type) {
      case ArcGISErrorType.CONNECTION:
        title = 'Connection Error';
        description = 'Could not connect to Benton County GIS services. Please check your internet connection.';
        break;
      case ArcGISErrorType.AUTHENTICATION:
        title = 'Authentication Error';
        description = 'Authentication with Benton County GIS services failed.';
        break;
      case ArcGISErrorType.SERVER:
        title = 'Server Error';
        description = 'Benton County GIS server encountered an error. Please try again later.';
        break;
      case ArcGISErrorType.TIMEOUT:
        title = 'Timeout Error';
        description = 'Request to Benton County GIS services timed out. Please try again.';
        break;
      case ArcGISErrorType.REQUEST:
      case ArcGISErrorType.UNKNOWN:
      default:
        // Use default message
        break;
    }
    
    toast({
      title,
      description,
      variant: 'destructive'
    });
    
    console.error(`ArcGIS Error during ${operation}:`, error);
  }, [toast]);

  // Get parcel by number
  const getParcelByNumber = useCallback(async (parcelNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await bentonArcGISClient.getParcelByNumber(parcelNumber);
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error as ArcGISError, `getParcelByNumber(${parcelNumber})`);
      setIsLoading(false);
      return null;
    }
  }, [handleError]);

  // Search parcels by owner name
  const searchParcelsByOwner = useCallback(async (ownerName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await bentonArcGISClient.searchParcelsByOwner(ownerName);
      setIsLoading(false);
      return results;
    } catch (error) {
      handleError(error as ArcGISError, `searchParcelsByOwner(${ownerName})`);
      setIsLoading(false);
      return [];
    }
  }, [handleError]);

  // Search parcels by address
  const searchParcelsByAddress = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await bentonArcGISClient.searchParcelsByAddress(address);
      setIsLoading(false);
      return results;
    } catch (error) {
      handleError(error as ArcGISError, `searchParcelsByAddress(${address})`);
      setIsLoading(false);
      return [];
    }
  }, [handleError]);

  // Get parcels within bounds
  const getParcelsInBounds = useCallback(async (minX: number, minY: number, maxX: number, maxY: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await bentonArcGISClient.getParcelsInBounds(minX, minY, maxX, maxY);
      setIsLoading(false);
      return results;
    } catch (error) {
      handleError(error as ArcGISError, `getParcelsInBounds(${minX},${minY},${maxX},${maxY})`);
      setIsLoading(false);
      return [];
    }
  }, [handleError]);

  // Get plat by name
  const getPlatByName = useCallback(async (platName: string, platType: 'short' | 'long' = 'short') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await bentonArcGISClient.getPlatByName(platName, platType);
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error as ArcGISError, `getPlatByName(${platName}, ${platType})`);
      setIsLoading(false);
      return null;
    }
  }, [handleError]);

  // Get zoning for a parcel
  const getZoningForParcel = useCallback(async (parcelGeometry: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await bentonArcGISClient.getZoningForParcel(parcelGeometry);
      setIsLoading(false);
      return results;
    } catch (error) {
      handleError(error as ArcGISError, 'getZoningForParcel');
      setIsLoading(false);
      return [];
    }
  }, [handleError]);

  // Get tax information for a parcel
  const getTaxInfoForParcel = useCallback(async (parcelNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await bentonArcGISClient.getTaxInfoForParcel(parcelNumber);
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error as ArcGISError, `getTaxInfoForParcel(${parcelNumber})`);
      setIsLoading(false);
      return null;
    }
  }, [handleError]);

  // Transform ArcGIS data to GeoJSON
  const transformToGeoJSON = useCallback((esriData: any) => {
    return bentonArcGISClient.esriToGeoJSON(esriData);
  }, []);

  // Authenticate with ArcGIS services if needed
  const authenticate = useCallback(async (username?: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await bentonArcGISClient.authenticate(username, password);
      setIsLoading(false);
      return result;
    } catch (error) {
      handleError(error as ArcGISError, 'authenticate');
      setIsLoading(false);
      return false;
    }
  }, [handleError]);

  // Clear all cache
  const clearCache = useCallback(() => {
    bentonArcGISClient.clearCache();
  }, []);

  // Clear specific cache by prefix
  const clearCacheByPrefix = useCallback((prefix: string) => {
    bentonArcGISClient.clearCacheByPrefix(prefix);
  }, []);

  return {
    isLoading,
    error,
    clearError,
    getParcelByNumber,
    searchParcelsByOwner,
    searchParcelsByAddress,
    getParcelsInBounds,
    getPlatByName,
    getZoningForParcel,
    getTaxInfoForParcel,
    transformToGeoJSON,
    authenticate,
    clearCache,
    clearCacheByPrefix
  };
}

export default useBentonArcGIS;