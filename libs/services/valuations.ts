/**
 * Valuations Service
 * 
 * This service provides methods for interacting with valuation data via the API.
 */

import { apiService } from './api';

// Valuation interfaces
export interface Valuation {
  id: string;
  parcelId: string;
  countyId: string;
  valuationDate: string;
  requestedBy?: string;
  landValue: number;
  improvementsValue: number;
  totalValue: number;
  confidence?: number;
  method: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValuationSearchOptions {
  countyId?: string;
  parcelId?: string;
  minDate?: string;
  maxDate?: string;
  method?: string;
  status?: string;
  minValue?: number;
  maxValue?: number;
  page?: number;
  limit?: number;
}

export interface ValuationsResponse {
  data: Valuation[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  }
}

// Valuations service class
export class ValuationsService {
  private baseUrl = '/api/terraform/valuations';

  /**
   * Get all valuations with pagination
   */
  async getValuations(options?: ValuationSearchOptions): Promise<ValuationsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options) {
        if (options.countyId) queryParams.append('countyId', options.countyId);
        if (options.parcelId) queryParams.append('parcelId', options.parcelId);
        if (options.minDate) queryParams.append('minDate', options.minDate);
        if (options.maxDate) queryParams.append('maxDate', options.maxDate);
        if (options.method) queryParams.append('method', options.method);
        if (options.status) queryParams.append('status', options.status);
        if (options.minValue) queryParams.append('minValue', options.minValue.toString());
        if (options.maxValue) queryParams.append('maxValue', options.maxValue.toString());
        if (options.page) queryParams.append('page', options.page.toString());
        if (options.limit) queryParams.append('limit', options.limit.toString());
      }
      
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      return await apiService.get<ValuationsResponse>(url);
    } catch (error) {
      console.error('Failed to fetch valuations:', error);
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
   * Get a valuation by ID
   */
  async getValuation(id: string): Promise<Valuation | null> {
    try {
      return await apiService.get<Valuation>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Failed to fetch valuation ${id}:`, error);
      return null;
    }
  }

  /**
   * Get valuations for a specific parcel
   */
  async getValuationsByParcel(parcelId: string): Promise<Valuation[]> {
    try {
      return await apiService.get<Valuation[]>(`${this.baseUrl}/parcel/${parcelId}`);
    } catch (error) {
      console.error(`Failed to fetch valuations for parcel ${parcelId}:`, error);
      return [];
    }
  }

  /**
   * Get recent valuations for a county
   */
  async getRecentValuationsByCounty(countyId: string, limit: number = 5): Promise<Valuation[]> {
    try {
      return await apiService.get<Valuation[]>(`${this.baseUrl}/county/${countyId}/recent?limit=${limit}`);
    } catch (error) {
      console.error(`Failed to fetch recent valuations for county ${countyId}:`, error);
      return [];
    }
  }

  /**
   * Create a new valuation
   */
  async createValuation(valuationData: Omit<Valuation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Valuation> {
    return await apiService.post<Valuation>(this.baseUrl, valuationData);
  }

  /**
   * Update a valuation
   */
  async updateValuation(id: string, valuationData: Partial<Omit<Valuation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Valuation> {
    return await apiService.put<Valuation>(`${this.baseUrl}/${id}`, valuationData);
  }

  /**
   * Delete a valuation
   */
  async deleteValuation(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Bulk import valuations
   */
  async importValuations(valuations: Omit<Valuation, 'id' | 'createdAt' | 'updatedAt'>[], countyId: string): Promise<{
    success: boolean;
    count: number;
    errors?: any[];
  }> {
    try {
      return await apiService.post<{
        success: boolean;
        count: number;
        errors?: any[];
      }>(`${this.baseUrl}/import/${countyId}`, { valuations });
    } catch (error) {
      console.error('Failed to import valuations:', error);
      return {
        success: false,
        count: 0,
        errors: [{ message: 'Failed to connect to the server' }]
      };
    }
  }

  /**
   * Request AI valuation for a parcel
   */
  async requestAIValuation(parcelId: string, options?: {
    useHistoricalData?: boolean;
    useComparables?: boolean;
    maxComparableDistance?: number;
    requestedBy?: string;
  }): Promise<Valuation> {
    return await apiService.post<Valuation>(`${this.baseUrl}/ai-valuation/${parcelId}`, options || {});
  }
}

// Export a singleton instance
export const valuationsService = new ValuationsService();