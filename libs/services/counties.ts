/**
 * Counties Service
 * 
 * This service provides methods for interacting with county data via the API.
 */

import { apiClient, ApiResponse } from './api';

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
    const response = await apiClient.get<County[]>(this.baseUrl);
    return response.data || [];
  }

  /**
   * Get a county by ID
   */
  async getCounty(id: string): Promise<County | null> {
    try {
      const response = await apiClient.get<County>(`${this.baseUrl}/${id}`);
      return response.data || null;
    } catch (error) {
      if ((error as any).status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new county
   */
  async createCounty(countyData: Omit<County, 'id' | 'createdAt' | 'updatedAt'>): Promise<County> {
    const response = await apiClient.post<County>(this.baseUrl, countyData);
    return response.data as County;
  }

  /**
   * Update a county
   */
  async updateCounty(id: string, countyData: Partial<Omit<County, 'id' | 'createdAt' | 'updatedAt'>>): Promise<County> {
    const response = await apiClient.put<County>(`${this.baseUrl}/${id}`, countyData);
    return response.data as County;
  }

  /**
   * Delete a county
   */
  async deleteCounty(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get layers for a county
   */
  async getCountyLayers(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.baseUrl}/${id}/layers`);
    return response.data || [];
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
    const response = await apiClient.get<{
      data: any[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      }
    }>(`${this.baseUrl}/${id}/parcels`, {
      params: { page, limit }
    });
    
    return response.data as any;
  }

  /**
   * Get statistics for a county
   */
  async getCountyStatistics(id: string): Promise<CountyStatistics> {
    const response = await apiClient.get<CountyStatistics>(`${this.baseUrl}/${id}/statistics`);
    return response.data as CountyStatistics;
  }
}

// Export a singleton instance
export const countiesService = new CountiesService();