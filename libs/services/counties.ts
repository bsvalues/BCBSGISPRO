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
  population: number;
  area: number;
  gisEnabled: boolean;
  boundaries: {
    type: string;
    coordinates: number[][][];
  };
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CountyStatistics {
  totalParcels: number;
  totalLayers: number;
  recentValuations: any[];
  lastUpdated: string;
}

// Counties service class
export class CountiesService {
  private baseUrl = '/api/terraform/counties';

  /**
   * Get all counties
   */
  async getCounties(): Promise<County[]> {
    try {
      return await apiService.get<County[]>(this.baseUrl);
    } catch (error) {
      console.error('Failed to fetch counties:', error);
      return [];
    }
  }

  /**
   * Get a county by ID
   */
  async getCounty(id: string): Promise<County | null> {
    try {
      return await apiService.get<County>(`${this.baseUrl}/${id}`);
    } catch (error) {
      if ((error as any).status === 404) {
        return null;
      }
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
   * Get layers for a county
   */
  async getCountyLayers(id: string): Promise<any[]> {
    try {
      return await apiService.get<any[]>(`${this.baseUrl}/${id}/layers`);
    } catch (error) {
      console.error(`Failed to fetch layers for county ${id}:`, error);
      return [];
    }
  }

  /**
   * Get parcels for a county with pagination
   */
  async getCountyParcels(id: string, page: number = 1, limit: number = 100): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    }
  }> {
    try {
      const url = `${this.baseUrl}/${id}/parcels?page=${page}&limit=${limit}`;
      return await apiService.get<{
        data: any[];
        pagination: {
          page: number;
          limit: number;
          totalCount: number;
          totalPages: number;
        }
      }>(url);
    } catch (error) {
      console.error(`Failed to fetch parcels for county ${id}:`, error);
      // Return empty result on error
      return {
        data: [],
        pagination: {
          page: page,
          limit: limit,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get statistics for a county
   */
  async getCountyStatistics(id: string): Promise<CountyStatistics> {
    try {
      return await apiService.get<CountyStatistics>(`${this.baseUrl}/${id}/statistics`);
    } catch (error) {
      console.error(`Failed to fetch statistics for county ${id}:`, error);
      // Return empty statistics on error
      return {
        totalParcels: 0,
        totalLayers: 0,
        recentValuations: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

// Export a singleton instance
export const countiesService = new CountiesService();