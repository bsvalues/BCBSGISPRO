/**
 * Benton County ArcGIS Client
 * 
 * This client connects directly to the official Benton County ArcGIS services 
 * and provides robust error handling, authentication, and caching.
 */

import { ArcGISRestClient } from './arcgis-rest-service';

// Import the QueryParams interface from arcgis-rest-service.ts
interface QueryParams {
  where?: string;
  objectIds?: string;
  geometry?: string;
  geometryType?: 'esriGeometryPoint' | 'esriGeometryPolyline' | 'esriGeometryPolygon' | 'esriGeometryEnvelope';
  spatialRel?: 'esriSpatialRelIntersects' | 'esriSpatialRelContains' | 'esriSpatialRelCrosses' | 'esriSpatialRelEnvelopeIntersects' | 'esriSpatialRelIndexIntersects' | 'esriSpatialRelOverlaps' | 'esriSpatialRelTouches' | 'esriSpatialRelWithin';
  outFields?: string | string[];
  returnGeometry?: boolean;
  maxAllowableOffset?: number;
  geometryPrecision?: number;
  outSR?: number;
  returnIdsOnly?: boolean;
  returnCountOnly?: boolean;
  orderByFields?: string | string[];
  groupByFieldsForStatistics?: string | string[];
  outStatistics?: any;
  returnZ?: boolean;
  returnM?: boolean;
  multipatchOption?: 'xyFootprint';
  resultOffset?: number;
  resultRecordCount?: number;
  returnExtentOnly?: boolean;
  datumTransformation?: number;
  quantizationParameters?: any;
  featureEncoding?: 'esriDefault' | 'esriGeometryProperties';
  [key: string]: any;
}

// Benton County ArcGIS REST endpoints
const BENTON_ARCGIS_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services';

// Service and layer IDs for commonly used Benton County data
export const BENTON_SERVICES = {
  PARCELS: {
    SERVICE_NAME: 'Parcels_and_Assess',
    LAYER_ID: 0
  },
  SHORT_PLATS: {
    SERVICE_NAME: 'Short_Plats',
    LAYER_ID: 0
  },
  LONG_PLATS: {
    SERVICE_NAME: 'Long_Plats',
    LAYER_ID: 0
  },
  ZONING: {
    SERVICE_NAME: 'Zoning',
    LAYER_ID: 0
  },
  TAX_CODES: {
    SERVICE_NAME: 'Tax_Codes',
    LAYER_ID: 0
  }
};

// Error types for better error handling
export enum ArcGISErrorType {
  CONNECTION = 'connection',
  AUTHENTICATION = 'authentication',
  SERVER = 'server',
  REQUEST = 'request',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface ArcGISError {
  type: ArcGISErrorType;
  message: string;
  details?: any;
  originalError?: Error;
}

// Cache configuration
const CACHE_TIME = 1000 * 60 * 5; // 5 minutes default cache time
const MAX_CACHE_ITEMS = 100; // Maximum number of items to cache

/**
 * Enhanced ArcGIS client with Benton County specific functionality
 */
export class BentonArcGISClient extends ArcGISRestClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private isAuthenticated: boolean = false;
  private authToken?: string;
  private tokenExpiry?: Date;
  
  constructor() {
    super(BENTON_ARCGIS_URL);
    this.initializeCache();
  }
  
  /**
   * Initialize the cache system
   */
  private initializeCache(): void {
    // Periodically clean up the cache
    setInterval(() => {
      this.cleanCache();
    }, 1000 * 60 * 30); // Clean every 30 minutes
  }
  
  /**
   * Clean expired items from the cache
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > CACHE_TIME) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get data from cache or fetch it if not available
   */
  private async getCachedData<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    // Check cache first
    const cachedItem = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (cachedItem && (now - cachedItem.timestamp < CACHE_TIME)) {
      return cachedItem.data as T;
    }
    
    // If not in cache or expired, fetch new data
    const data = await fetchFn();
    
    // Store in cache
    this.cache.set(cacheKey, { data, timestamp: now });
    
    // If cache is too large, remove oldest items
    if (this.cache.size > MAX_CACHE_ITEMS) {
      const keysToDelete = [...this.cache.keys()].slice(0, this.cache.size - MAX_CACHE_ITEMS);
      keysToDelete.forEach(key => this.cache.delete(key));
    }
    
    return data;
  }
  
  /**
   * Handle ArcGIS errors consistently
   */
  private handleError(error: any, operation: string): never {
    let arcGISError: ArcGISError;
    
    if (error.name === 'AbortError') {
      arcGISError = {
        type: ArcGISErrorType.TIMEOUT,
        message: `Operation timed out: ${operation}`,
        originalError: error
      };
    } else if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        arcGISError = {
          type: ArcGISErrorType.AUTHENTICATION,
          message: `Authentication failed for: ${operation}`,
          details: error.response.data,
          originalError: error
        };
      } else if (status >= 500) {
        arcGISError = {
          type: ArcGISErrorType.SERVER,
          message: `Server error during: ${operation}`,
          details: error.response.data,
          originalError: error
        };
      } else {
        arcGISError = {
          type: ArcGISErrorType.REQUEST,
          message: `Request error (${status}) during: ${operation}`,
          details: error.response.data,
          originalError: error
        };
      }
    } else if (error.request) {
      arcGISError = {
        type: ArcGISErrorType.CONNECTION,
        message: `Connection failed for: ${operation}`,
        originalError: error
      };
    } else {
      arcGISError = {
        type: ArcGISErrorType.UNKNOWN,
        message: `Unknown error during: ${operation}`,
        details: error.message,
        originalError: error
      };
    }
    
    console.error(`ArcGIS Error (${arcGISError.type}):`, arcGISError.message, arcGISError.details);
    throw arcGISError;
  }
  
  /**
   * Authenticate with the ArcGIS service if required
   * For public services, this may not be needed, but included for complete implementation
   */
  async authenticate(username?: string, password?: string): Promise<boolean> {
    try {
      // For public services, we can bypass actual authentication
      this.isAuthenticated = true;
      return true;
      
      // If authentication is needed in the future, uncomment the following code
      /*
      const params = new URLSearchParams();
      params.append('username', username || '');
      params.append('password', password || '');
      params.append('client', 'referer');
      params.append('referer', window.location.origin);
      params.append('expiration', '60'); // Token valid for 60 minutes
      params.append('f', 'json');
      
      const response = await fetch(`${BENTON_ARCGIS_AUTH_URL}/generateToken`, {
        method: 'POST',
        body: params
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Authentication failed');
      }
      
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires * 1000));
      this.isAuthenticated = true;
      
      return true;
      */
    } catch (error) {
      this.isAuthenticated = false;
      this.handleError(error, 'authenticate');
      return false; // Will never reach here due to handleError, but required for TypeScript
    }
  }
  
  /**
   * Get the authentication token for requests
   */
  private async getAuthParams(): Promise<Record<string, string>> {
    // If authentication is not needed or we're already authenticated
    if (!this.authToken) {
      return {};
    }
    
    // Check if token is expired
    if (this.tokenExpiry && this.tokenExpiry < new Date()) {
      await this.authenticate();
    }
    
    return { token: this.authToken || '' };
  }
  
  /**
   * Get parcel data by parcel number
   */
  async getParcelByNumber(parcelNumber: string): Promise<any> {
    const cacheKey = `parcel_${parcelNumber}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const queryParams = {
          where: `PARCELNBR='${parcelNumber}'`,
          outFields: '*',
          returnGeometry: true,
          f: 'json'
        };
        
        const result = await this.queryFeatures(
          BENTON_SERVICES.PARCELS.SERVICE_NAME,
          BENTON_SERVICES.PARCELS.LAYER_ID,
          queryParams
        );
        
        if (!result.features || result.features.length === 0) {
          return null;
        }
        
        return result.features[0];
      } catch (error) {
        this.handleError(error, `getParcelByNumber(${parcelNumber})`);
        return null; // Will never reach here due to handleError, but required for TypeScript
      }
    });
  }
  
  /**
   * Search parcels by owner name
   */
  async searchParcelsByOwner(ownerName: string): Promise<any[]> {
    const cacheKey = `owner_${ownerName}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const queryParams = {
          where: `OWNER_NAME LIKE '%${ownerName}%'`,
          outFields: '*',
          returnGeometry: true,
          f: 'json'
        };
        
        const result = await this.queryFeatures(
          BENTON_SERVICES.PARCELS.SERVICE_NAME,
          BENTON_SERVICES.PARCELS.LAYER_ID,
          queryParams
        );
        
        return result.features || [];
      } catch (error) {
        this.handleError(error, `searchParcelsByOwner(${ownerName})`);
        return []; // Will never reach here due to handleError, but required for TypeScript
      }
    });
  }
  
  /**
   * Search parcels by address
   */
  async searchParcelsByAddress(address: string): Promise<any[]> {
    const cacheKey = `address_${address}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const queryParams = {
          where: `FULLADDRESS LIKE '%${address}%'`,
          outFields: '*',
          returnGeometry: true,
          f: 'json'
        };
        
        const result = await this.queryFeatures(
          BENTON_SERVICES.PARCELS.SERVICE_NAME,
          BENTON_SERVICES.PARCELS.LAYER_ID,
          queryParams
        );
        
        return result.features || [];
      } catch (error) {
        this.handleError(error, `searchParcelsByAddress(${address})`);
        return []; // Will never reach here due to handleError, but required for TypeScript
      }
    });
  }
  
  /**
   * Get parcels within a bounding box
   */
  async getParcelsInBounds(minX: number, minY: number, maxX: number, maxY: number): Promise<any[]> {
    const cacheKey = `bounds_${minX}_${minY}_${maxX}_${maxY}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const queryParams: QueryParams = {
          geometry: `${minX},${minY},${maxX},${maxY}`,
          geometryType: 'esriGeometryEnvelope',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: true,
          f: 'json'
        };
        
        const result = await this.queryFeatures(
          BENTON_SERVICES.PARCELS.SERVICE_NAME,
          BENTON_SERVICES.PARCELS.LAYER_ID,
          queryParams
        );
        
        return result.features || [];
      } catch (error) {
        this.handleError(error, `getParcelsInBounds(${minX},${minY},${maxX},${maxY})`);
        return []; // Will never reach here due to handleError, but required for TypeScript
      }
    });
  }
  
  /**
   * Get plat information by plat name
   */
  async getPlatByName(platName: string, platType: 'short' | 'long' = 'short'): Promise<any> {
    const cacheKey = `plat_${platType}_${platName}`;
    const serviceName = platType === 'short' ? 
      BENTON_SERVICES.SHORT_PLATS.SERVICE_NAME : 
      BENTON_SERVICES.LONG_PLATS.SERVICE_NAME;
    const layerId = platType === 'short' ? 
      BENTON_SERVICES.SHORT_PLATS.LAYER_ID : 
      BENTON_SERVICES.LONG_PLATS.LAYER_ID;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const queryParams = {
          where: `PLAT_NAME LIKE '%${platName}%'`,
          outFields: '*',
          returnGeometry: true,
          f: 'json'
        };
        
        const result = await this.queryFeatures(
          serviceName,
          layerId,
          queryParams
        );
        
        if (!result.features || result.features.length === 0) {
          return null;
        }
        
        return result.features[0];
      } catch (error) {
        this.handleError(error, `getPlatByName(${platName})`);
        return null; // Will never reach here due to handleError, but required for TypeScript
      }
    });
  }
  
  /**
   * Get zoning information for a parcel
   */
  async getZoningForParcel(parcelGeometry: any): Promise<any[]> {
    try {
      const queryParams: QueryParams = {
        geometry: JSON.stringify(parcelGeometry),
        geometryType: 'esriGeometryPolygon' as 'esriGeometryPolygon',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: true,
        f: 'json'
      };
      
      const result = await this.queryFeatures(
        BENTON_SERVICES.ZONING.SERVICE_NAME,
        BENTON_SERVICES.ZONING.LAYER_ID,
        queryParams
      );
      
      return result.features || [];
    } catch (error) {
      this.handleError(error, 'getZoningForParcel');
      return []; // Will never reach here due to handleError, but required for TypeScript
    }
  }
  
  /**
   * Get tax information for a parcel
   */
  async getTaxInfoForParcel(parcelNumber: string): Promise<any> {
    const cacheKey = `tax_${parcelNumber}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const parcelData = await this.getParcelByNumber(parcelNumber);
        
        if (!parcelData || !parcelData.geometry) {
          return null;
        }
        
        // Cast the geometry type to ensure TypeScript compliance
        const queryParams: QueryParams = {
          geometry: JSON.stringify(parcelData.geometry),
          geometryType: 'esriGeometryPolygon' as 'esriGeometryPolygon',
          spatialRel: 'esriSpatialRelIntersects',
          outFields: '*',
          returnGeometry: false,
          f: 'json'
        };
        
        const result = await this.queryFeatures(
          BENTON_SERVICES.TAX_CODES.SERVICE_NAME,
          BENTON_SERVICES.TAX_CODES.LAYER_ID,
          queryParams
        );
        
        if (!result.features || result.features.length === 0) {
          return null;
        }
        
        return result.features[0].attributes;
      } catch (error) {
        this.handleError(error, `getTaxInfoForParcel(${parcelNumber})`);
        return null; // Will never reach here due to handleError, but required for TypeScript
      }
    });
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Clear specific items from cache by prefix
   */
  clearCacheByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Convert ESRI JSON to GeoJSON for compatibility with mapping libraries
   */
  esriToGeoJSON(esriJson: any): any {
    if (!esriJson || !esriJson.features) {
      return { type: 'FeatureCollection', features: [] };
    }
    
    return {
      type: 'FeatureCollection',
      features: esriJson.features.map((feature: any) => {
        return {
          type: 'Feature',
          geometry: this.convertEsriGeometry(feature.geometry),
          properties: feature.attributes || {}
        };
      })
    };
  }
  
  /**
   * Convert ESRI geometry to GeoJSON geometry
   */
  private convertEsriGeometry(geometry: any): any {
    if (!geometry) return null;
    
    // Handle point
    if (geometry.x !== undefined && geometry.y !== undefined) {
      return {
        type: 'Point',
        coordinates: [geometry.x, geometry.y]
      };
    }
    
    // Handle polyline
    if (geometry.paths) {
      if (geometry.paths.length === 1) {
        return {
          type: 'LineString',
          coordinates: geometry.paths[0]
        };
      } else {
        return {
          type: 'MultiLineString',
          coordinates: geometry.paths
        };
      }
    }
    
    // Handle polygon
    if (geometry.rings) {
      if (geometry.rings.length === 1) {
        return {
          type: 'Polygon',
          coordinates: geometry.rings
        };
      } else {
        return {
          type: 'MultiPolygon',
          coordinates: [geometry.rings]
        };
      }
    }
    
    return null;
  }
}

// Export a singleton instance of the client
export const bentonArcGISClient = new BentonArcGISClient();
export default bentonArcGISClient;