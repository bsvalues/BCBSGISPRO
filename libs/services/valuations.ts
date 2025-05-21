/**
 * Valuations API service
 * 
 * This module provides functions for interacting with the Valuations API endpoints.
 * It uses the core ApiClient to handle HTTP requests and standardizes the interface
 * for property valuation operations.
 */

import { apiClient, ApiRequestOptions } from './api';

export interface Valuation {
  id: string;
  parcelId: string;
  countyId: string;
  valuationDate: Date;
  requestedBy: string;
  landValue: number;
  improvementsValue: number;
  totalValue: number;
  confidence: number; // 0-1 scale representing confidence in the valuation
  method: 'comparable-sales' | 'income' | 'cost' | 'ai-assisted' | 'manual';
  status: 'pending' | 'completed' | 'failed' | 'review-required';
  notes?: string;
  comparableProperties?: string[]; // Array of parcel IDs used for comparison
  factors?: {
    location?: number;
    size?: number;
    improvements?: number;
    condition?: number;
    market?: number;
    other?: Record<string, number>;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValuationFilter {
  countyId?: string;
  parcelId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  minValue?: number;
  maxValue?: number;
  method?: Valuation['method'];
  status?: Valuation['status'];
  requestedBy?: string;
  limit?: number;
  offset?: number;
}

export interface ValuationParameters {
  parcelId: string;
  countyId: string;
  method?: Valuation['method'];
  options?: {
    useComparableSales?: boolean;
    useAI?: boolean;
    includeTaxData?: boolean;
    includeMarketTrends?: boolean;
    maxComparableDistance?: number; // in miles
    minComparableSimilarity?: number; // 0-1 scale
    adjustForInflation?: boolean;
    customFactors?: Record<string, number>;
  };
  notes?: string;
}

/**
 * Get all valuations with optional filtering
 */
export async function getValuations(filters?: ValuationFilter) {
  const response = await apiClient.get<Valuation[]>('/valuations', {
    params: filters as Record<string, string | number | boolean | undefined>
  });
  return response.data || [];
}

/**
 * Get a specific valuation by ID
 */
export async function getValuation(id: string) {
  const response = await apiClient.get<Valuation>(`/valuations/${id}`);
  return response.data;
}

/**
 * Get valuations for a specific parcel
 */
export async function getValuationsByParcel(parcelId: string, filters?: Omit<ValuationFilter, 'parcelId'>) {
  return getValuations({
    parcelId,
    ...filters
  });
}

/**
 * Get valuations for a specific county
 */
export async function getValuationsByCounty(countyId: string, filters?: Omit<ValuationFilter, 'countyId'>) {
  return getValuations({
    countyId,
    ...filters
  });
}

/**
 * Request a new valuation
 */
export async function requestValuation(parameters: ValuationParameters) {
  const response = await apiClient.post<Valuation>('/valuations', parameters);
  return response.data;
}

/**
 * Update an existing valuation
 */
export async function updateValuation(id: string, valuationData: Partial<Omit<Valuation, 'id' | 'createdAt' | 'updatedAt'>>) {
  const response = await apiClient.patch<Valuation>(`/valuations/${id}`, valuationData);
  return response.data;
}

/**
 * Delete a valuation
 */
export async function deleteValuation(id: string) {
  const response = await apiClient.delete<{ success: boolean }>(`/valuations/${id}`);
  return response.data;
}

/**
 * Request a review for a valuation
 */
export async function requestValuationReview(id: string, notes: string) {
  const response = await apiClient.post<Valuation>(`/valuations/${id}/review`, { notes });
  return response.data;
}

/**
 * Approve a valuation after review
 */
export async function approveValuation(id: string, notes?: string) {
  const response = await apiClient.post<Valuation>(`/valuations/${id}/approve`, { notes });
  return response.data;
}

/**
 * Get valuation history for a parcel
 */
export async function getValuationHistory(parcelId: string) {
  const response = await apiClient.get<{
    valuations: Valuation[];
    trend: {
      dates: string[];
      values: number[];
    };
  }>(`/parcels/${parcelId}/valuation-history`);
  return response.data;
}

/**
 * Generate a valuation report
 */
export async function generateValuationReport(valuationId: string, format: 'pdf' | 'json' | 'csv' = 'pdf') {
  const response = await apiClient.get<Blob>(`/valuations/${valuationId}/report`, {
    params: { format },
    headers: {
      'Accept': format === 'pdf' ? 'application/pdf' : 
                format === 'csv' ? 'text/csv' : 'application/json'
    }
  });
  return response.data;
}