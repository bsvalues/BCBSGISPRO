/**
 * Parcels Service
 * 
 * This service provides methods for interacting with parcel data via the API.
 */

import { apiService } from './api';

// Parcel interfaces
export interface Parcel {
  id: string;
  parcelNumber: string;
  countyId: string;
  address?: string;
  owner?: string;
  legalDescription?: string;
  acres?: number;
  landUseCode?: string;
  zoning?: string;
  geometry?: any; // GeoJSON for parcel boundaries
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelSearchOptions {
  countyId?: string;
  owner?: string;
  address?: string;
  landUseCode?: string;
  zoning?: string;
  minAcres?: number;
  maxAcres?: number;
  page?: number;
  limit?: number;
}

export interface ParcelsResponse {
  data: Parcel[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  }
}

// Parcels service class
export class ParcelsService {
  private baseUrl = '/api/terraform/parcels';

  /**
   * Get all parcels with pagination
   */
  async getParcels(options?: ParcelSearchOptions): Promise<ParcelsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options) {
        if (options.countyId) queryParams.append('countyId', options.countyId);
        if (options.owner) queryParams.append('owner', options.owner);
        if (options.address) queryParams.append('address', options.address);
        if (options.landUseCode) queryParams.append('landUseCode', options.landUseCode);
        if (options.zoning) queryParams.append('zoning', options.zoning);
        if (options.minAcres) queryParams.append('minAcres', options.minAcres.toString());
        if (options.maxAcres) queryParams.append('maxAcres', options.maxAcres.toString());
        if (options.page) queryParams.append('page', options.page.toString());
        if (options.limit) queryParams.append('limit', options.limit.toString());
      }
      
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      return await apiService.get<ParcelsResponse>(url);
    } catch (error) {
      console.error('Failed to fetch parcels:', error);
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
   * Get a parcel by ID
   */
  async getParcel(id: string): Promise<Parcel | null> {
    try {
      return await apiService.get<Parcel>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error(`Failed to fetch parcel ${id}:`, error);
      return null;
    }
  }

  /**
   * Get parcels for a specific county with pagination
   */
  async getParcelsByCounty(countyId: string, page: number = 1, limit: number = 10): Promise<ParcelsResponse> {
    return this.getParcels({
      countyId,
      page,
      limit
    });
  }

  /**
   * Create a new parcel
   */
  async createParcel(parcelData: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>): Promise<Parcel> {
    return await apiService.post<Parcel>(this.baseUrl, parcelData);
  }

  /**
   * Update a parcel
   */
  async updateParcel(id: string, parcelData: Partial<Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Parcel> {
    return await apiService.put<Parcel>(`${this.baseUrl}/${id}`, parcelData);
  }

  /**
   * Delete a parcel
   */
  async deleteParcel(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get parcels by legal description search
   */
  async searchParcelsByLegalDescription(query: string, countyId?: string, limit: number = 10): Promise<Parcel[]> {
    try {
      const queryParams = new URLSearchParams({
        legalDescription: query,
        limit: limit.toString()
      });
      
      if (countyId) {
        queryParams.append('countyId', countyId);
      }
      
      return await apiService.get<Parcel[]>(`${this.baseUrl}/search/legal?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to search parcels by legal description:', error);
      return [];
    }
  }

  /**
   * Get parcels by owner search
   */
  async searchParcelsByOwner(query: string, countyId?: string, limit: number = 10): Promise<Parcel[]> {
    try {
      const queryParams = new URLSearchParams({
        owner: query,
        limit: limit.toString()
      });
      
      if (countyId) {
        queryParams.append('countyId', countyId);
      }
      
      return await apiService.get<Parcel[]>(`${this.baseUrl}/search/owner?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to search parcels by owner:', error);
      return [];
    }
  }

  /**
   * Get parcels by address search
   */
  async searchParcelsByAddress(query: string, countyId?: string, limit: number = 10): Promise<Parcel[]> {
    try {
      const queryParams = new URLSearchParams({
        address: query,
        limit: limit.toString()
      });
      
      if (countyId) {
        queryParams.append('countyId', countyId);
      }
      
      return await apiService.get<Parcel[]>(`${this.baseUrl}/search/address?${queryParams.toString()}`);
    } catch (error) {
      console.error('Failed to search parcels by address:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const parcelsService = new ParcelsService();