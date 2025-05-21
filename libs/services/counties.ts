/**
 * Counties Service
 * 
 * This service provides methods for interacting with county data via the API.
 */

import { apiService } from './api';

// County interfaces
export interface County {
  id: string;
  name: string;
  state: string;
  population?: number;
  area?: number;
  gisEnabled?: boolean;
  boundaries?: any; // GeoJSON for county boundaries
  contact?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CountySearchOptions {
  state?: string;
  name?: string;
  gisEnabled?: boolean;
  page?: number;
  limit?: number;
}

export interface CountiesResponse {
  data: County[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  }
}

// Counties service class
export class CountiesService {
  private baseUrl = '/api/terraform/counties';

  /**
   * Get all counties with pagination
   */
  async getCounties(options?: CountySearchOptions): Promise<CountiesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options) {
        if (options.state) queryParams.append('state', options.state);
        if (options.name) queryParams.append('name', options.name);
        if (options.gisEnabled !== undefined) queryParams.append('gisEnabled', options.gisEnabled.toString());
        if (options.page) queryParams.append('page', options.page.toString());
        if (options.limit) queryParams.append('limit', options.limit.toString());
      }
      
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      return await apiService.get<CountiesResponse>(url);
    } catch (error) {
      console.error('Failed to fetch counties:', error);
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
   * Get a county by ID
   */
  async getCounty(id: string): Promise<County | null> {
    try {
      return await apiService.get<County>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Failed to fetch county ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new county
   */
  async createCounty(countyData: Omit<County, 'id' | 'createdAt' | 'updatedAt'>): Promise<County> {
    return await apiService.post<County>(this.baseUrl, countyData);
  }

  /**
   * Update a county
   */
  async updateCounty(id: string, countyData: Partial<Omit<County, 'id' | 'createdAt' | 'updatedAt'>>): Promise<County> {
    return await apiService.put<County>(`${this.baseUrl}/${id}`, countyData);
  }

  /**
   * Delete a county
   */
  async deleteCounty(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get a county's statistics
   */
  async getCountyStats(id: string): Promise<{
    parcelCount: number;
    valuationCount: number;
    mapLayerCount: number;
    averageValue: number;
    updatedAt: string;
  }> {
    try {
      return await apiService.get<{
        parcelCount: number;
        valuationCount: number;
        mapLayerCount: number;
        averageValue: number;
        updatedAt: string;
      }>(`${this.baseUrl}/${id}/stats`);
    } catch (error) {
      console.error(`Failed to fetch stats for county ${id}:`, error);
      return {
        parcelCount: 0,
        valuationCount: 0,
        mapLayerCount: 0,
        averageValue: 0,
        updatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Toggle a county's GIS enabled status
   */
  async toggleGisEnabled(id: string, enabled: boolean): Promise<County> {
    return await apiService.patch<County>(`${this.baseUrl}/${id}/toggle-gis`, { gisEnabled: enabled });
  }

  /**
   * Upload county boundaries as GeoJSON
   */
  async uploadBoundaries(id: string, boundaries: any): Promise<County> {
    return await apiService.patch<County>(`${this.baseUrl}/${id}/boundaries`, { boundaries });
  }
}

// Export a singleton instance
export const countiesService = new CountiesService();