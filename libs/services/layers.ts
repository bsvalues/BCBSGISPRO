/**
 * Map Layers Service
 * 
 * This service provides methods for interacting with map layer data via the API.
 */

import { apiService } from './api';

// Map Layer interfaces
export interface MapLayer {
  id: string;
  name: string;
  countyId: string;
  type: string;
  url?: string;
  apiKey?: string;
  isEnabled: boolean;
  opacity: number;
  zIndex: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface LayerSearchOptions {
  countyId?: string;
  type?: string;
  isEnabled?: boolean;
  name?: string;
  page?: number;
  limit?: number;
}

export interface MapLayersResponse {
  data: MapLayer[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  }
}

// Map Layers service class
export class MapLayersService {
  private baseUrl = '/api/terraform/layers';

  /**
   * Get all map layers with pagination
   */
  async getLayers(options?: LayerSearchOptions): Promise<MapLayersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options) {
        if (options.countyId) queryParams.append('countyId', options.countyId);
        if (options.type) queryParams.append('type', options.type);
        if (options.isEnabled !== undefined) queryParams.append('isEnabled', options.isEnabled.toString());
        if (options.name) queryParams.append('name', options.name);
        if (options.page) queryParams.append('page', options.page.toString());
        if (options.limit) queryParams.append('limit', options.limit.toString());
      }
      
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      return await apiService.get<MapLayersResponse>(url);
    } catch (error) {
      console.error('Failed to fetch map layers:', error);
      // Return empty result on error
      return {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get a map layer by ID
   */
  async getLayer(id: string): Promise<MapLayer | null> {
    try {
      return await apiService.get<MapLayer>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Failed to fetch map layer ${id}:`, error);
      return null;
    }
  }

  /**
   * Get layers for a specific county
   */
  async getLayersByCounty(countyId: string): Promise<MapLayer[]> {
    try {
      return await apiService.get<MapLayer[]>(`${this.baseUrl}/county/${countyId}`);
    } catch (error) {
      console.error(`Failed to fetch layers for county ${countyId}:`, error);
      return [];
    }
  }

  /**
   * Create a new map layer
   */
  async createLayer(layerData: Omit<MapLayer, 'id' | 'createdAt' | 'updatedAt'>): Promise<MapLayer> {
    return await apiService.post<MapLayer>(this.baseUrl, layerData);
  }

  /**
   * Update a map layer
   */
  async updateLayer(id: string, layerData: Partial<Omit<MapLayer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<MapLayer> {
    return await apiService.put<MapLayer>(`${this.baseUrl}/${id}`, layerData);
  }

  /**
   * Delete a map layer
   */
  async deleteLayer(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Toggle a map layer's enabled status
   */
  async toggleLayerEnabled(id: string, isEnabled: boolean): Promise<MapLayer> {
    return await apiService.patch<MapLayer>(`${this.baseUrl}/${id}/toggle`, { isEnabled });
  }

  /**
   * Update a map layer's opacity
   */
  async updateLayerOpacity(id: string, opacity: number): Promise<MapLayer> {
    return await apiService.patch<MapLayer>(`${this.baseUrl}/${id}/opacity`, { opacity });
  }

  /**
   * Update a map layer's z-index
   */
  async updateLayerZIndex(id: string, zIndex: number): Promise<MapLayer> {
    return await apiService.patch<MapLayer>(`${this.baseUrl}/${id}/z-index`, { zIndex });
  }

  /**
   * Import layers from a GIS service (ArcGIS, MapBox, etc.)
   */
  async importLayers(countyId: string, serviceUrl: string, serviceType: string, apiKey?: string): Promise<{
    success: boolean;
    count: number;
    layers: MapLayer[];
    errors?: any[];
  }> {
    try {
      return await apiService.post<{
        success: boolean;
        count: number;
        layers: MapLayer[];
        errors?: any[];
      }>(`${this.baseUrl}/import`, {
        countyId,
        serviceUrl,
        serviceType,
        apiKey
      });
    } catch (error) {
      console.error('Failed to import layers:', error);
      return {
        success: false,
        count: 0,
        layers: [],
        errors: [{ message: 'Failed to connect to the server' }]
      };
    }
  }
}

// Export a singleton instance
export const mapLayersService = new MapLayersService();