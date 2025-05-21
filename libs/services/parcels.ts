/**
 * Parcels API service
 * 
 * This module provides functions for interacting with the Parcels API endpoints.
 * It uses the core ApiClient to handle HTTP requests and standardizes the interface
 * for parcel-related operations.
 */

import { apiClient, ApiRequestOptions } from './api';

// Import the parcel type from our standardized types
export interface Parcel {
  id: string;
  countyId: string;
  apn: string; // Assessor's Parcel Number
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  legalDescription?: string;
  acreage?: number;
  geometry?: {
    type: string;
    coordinates: any;
  };
  zoning?: string;
  landUse?: string;
  propertyClass?: string;
  ownerName?: string;
  ownerAddress?: string;
  lastAssessmentDate?: Date;
  assessedValue?: {
    land: number;
    improvements: number;
    total: number;
  };
  marketValue?: {
    land: number;
    improvements: number;
    total: number;
  };
  lastSaleDate?: Date;
  lastSalePrice?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface ParcelFilter {
  countyId?: string;
  apn?: string;
  ownerName?: string;
  minAcreage?: number;
  maxAcreage?: number;
  zoning?: string;
  landUse?: string;
  propertyClass?: string;
  minValue?: number;
  maxValue?: number;
  active?: boolean;
  bbox?: [number, number, number, number]; // min_x, min_y, max_x, max_y
  limit?: number;
  offset?: number;
}

/**
 * Get all parcels with optional filtering
 */
export async function getParcels(filters?: ParcelFilter) {
  const response = await apiClient.get<Parcel[]>('/parcels', {
    params: filters as Record<string, string | number | boolean | undefined>
  });
  return response.data || [];
}

/**
 * Get a specific parcel by ID
 */
export async function getParcel(id: string) {
  const response = await apiClient.get<Parcel>(`/parcels/${id}`);
  return response.data;
}

/**
 * Get parcels by county
 */
export async function getParcelsByCounty(countyId: string, filters?: Omit<ParcelFilter, 'countyId'>) {
  return getParcels({
    countyId,
    ...filters
  });
}

/**
 * Create a new parcel
 */
export async function createParcel(parcelData: Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await apiClient.post<Parcel>('/parcels', parcelData);
  return response.data;
}

/**
 * Update an existing parcel
 */
export async function updateParcel(id: string, parcelData: Partial<Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>>) {
  const response = await apiClient.patch<Parcel>(`/parcels/${id}`, parcelData);
  return response.data;
}

/**
 * Delete a parcel
 */
export async function deleteParcel(id: string) {
  const response = await apiClient.delete<{ success: boolean }>(`/parcels/${id}`);
  return response.data;
}

/**
 * Get parcels within a bounding box
 */
export async function getParcelsInBoundingBox(
  countyId: string,
  bbox: [number, number, number, number], // min_x, min_y, max_x, max_y
  filters?: Omit<ParcelFilter, 'countyId' | 'bbox'>
) {
  return getParcels({
    countyId,
    bbox,
    ...filters
  });
}

/**
 * Batch import parcels
 */
export async function batchImportParcels(countyId: string, parcels: Array<Omit<Parcel, 'id' | 'createdAt' | 'updatedAt'>>) {
  const response = await apiClient.post<{ 
    success: boolean;
    imported: number;
    errors?: Array<{
      index: number;
      error: string;
    }>;
  }>(`/counties/${countyId}/parcels/batch`, { parcels });
  return response.data;
}

/**
 * Get parcel history
 */
export async function getParcelHistory(id: string) {
  const response = await apiClient.get<Array<{
    id: string;
    parcelId: string;
    userId: string;
    action: 'create' | 'update' | 'delete';
    timestamp: Date;
    changes: Record<string, { old: any; new: any }>;
  }>>(`/parcels/${id}/history`);
  return response.data || [];
}