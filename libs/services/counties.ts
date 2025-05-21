/**
 * Counties API service
 * 
 * This module provides functions for interacting with the Counties API endpoints.
 * It uses the core ApiClient to handle HTTP requests and standardizes the interface
 * for county-related operations.
 */

import { apiClient, ApiRequestOptions } from './api';
import { CountyConfig } from '../types';

export interface CountyFilter {
  status?: 'draft' | 'pending' | 'active' | 'archived';
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all counties with optional filtering
 */
export async function getCounties(filters?: CountyFilter) {
  const response = await apiClient.get<CountyConfig[]>('/counties', {
    params: filters as Record<string, string | number | boolean | undefined>
  });
  return response.data || [];
}

/**
 * Get a specific county by ID
 */
export async function getCounty(id: string) {
  const response = await apiClient.get<CountyConfig>(`/counties/${id}`);
  return response.data;
}

/**
 * Create a new county
 */
export async function createCounty(countyData: Omit<CountyConfig, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>) {
  const response = await apiClient.post<CountyConfig>('/counties', countyData);
  return response.data;
}

/**
 * Update an existing county
 */
export async function updateCounty(id: string, countyData: Partial<Omit<CountyConfig, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>>) {
  const response = await apiClient.patch<CountyConfig>(`/counties/${id}`, countyData);
  return response.data;
}

/**
 * Delete a county
 */
export async function deleteCounty(id: string) {
  const response = await apiClient.delete<{ success: boolean }>(`/counties/${id}`);
  return response.data;
}

/**
 * Activate a county
 */
export async function activateCounty(id: string) {
  const response = await apiClient.post<CountyConfig>(`/counties/${id}/activate`, {});
  return response.data;
}

/**
 * Archive a county
 */
export async function archiveCounty(id: string) {
  const response = await apiClient.post<CountyConfig>(`/counties/${id}/archive`, {});
  return response.data;
}

/**
 * Get county statistics
 */
export async function getCountyStats(id: string) {
  const response = await apiClient.get<{
    parcelCount: number;
    valuationCount: number;
    userCount: number;
    lastUpdated: string;
  }>(`/counties/${id}/stats`);
  return response.data;
}

/**
 * Test a county's data source connection
 */
export async function testCountyDataSource(countyId: string, dataSourceId: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
  }>(`/counties/${countyId}/datasources/${dataSourceId}/test`, {});
  return response.data;
}

/**
 * Get county validation issues
 */
export async function getCountyValidationIssues(id: string) {
  const response = await apiClient.get<Array<{
    type: 'error' | 'warning';
    message: string;
    component: string;
    resolved: boolean;
  }>>(`/counties/${id}/validation-issues`);
  return response.data || [];
}

/**
 * Resolve a county validation issue
 */
export async function resolveCountyValidationIssue(countyId: string, issueId: string) {
  const response = await apiClient.post<{ success: boolean }>(`/counties/${countyId}/validation-issues/${issueId}/resolve`, {});
  return response.data;
}