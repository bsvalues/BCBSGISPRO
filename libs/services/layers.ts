/**
 * Layers API service
 * 
 * This module provides functions for interacting with the Map Layers API endpoints.
 * It uses the core ApiClient to handle HTTP requests and standardizes the interface
 * for map layer-related operations.
 */

import { apiClient, ApiRequestOptions } from './api';

export interface Layer {
  id: string;
  countyId: string;
  name: string;
  type: 'vector' | 'raster' | 'tile' | 'wms' | 'arcgis' | 'geojson';
  description?: string;
  source: {
    type: string;
    url?: string;
    tileSize?: number;
    attribution?: string;
    data?: any;
  };
  style?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
    opacity?: number;
    dashArray?: string;
  };
  visibility: {
    visible: boolean;
    minZoom?: number;
    maxZoom?: number;
  };
  metadata?: {
    dateCreated?: string;
    dateUpdated?: string;
    source?: string;
    owner?: string;
    tags?: string[];
    [key: string]: any;
  };
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayerFilter {
  countyId?: string;
  type?: Layer['type'];
  visible?: boolean;
  search?: string;
  tags?: string[];
  active?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get all layers with optional filtering
 */
export async function getLayers(filters?: LayerFilter) {
  const response = await apiClient.get<Layer[]>('/layers', {
    params: filters as Record<string, string | number | boolean | undefined>
  });
  return response.data || [];
}

/**
 * Get a specific layer by ID
 */
export async function getLayer(id: string) {
  const response = await apiClient.get<Layer>(`/layers/${id}`);
  return response.data;
}

/**
 * Get layers for a specific county
 */
export async function getLayersByCounty(countyId: string, filters?: Omit<LayerFilter, 'countyId'>) {
  return getLayers({
    countyId,
    ...filters
  });
}

/**
 * Create a new layer
 */
export async function createLayer(layerData: Omit<Layer, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await apiClient.post<Layer>('/layers', layerData);
  return response.data;
}

/**
 * Update an existing layer
 */
export async function updateLayer(id: string, layerData: Partial<Omit<Layer, 'id' | 'createdAt' | 'updatedAt'>>) {
  const response = await apiClient.patch<Layer>(`/layers/${id}`, layerData);
  return response.data;
}

/**
 * Delete a layer
 */
export async function deleteLayer(id: string) {
  const response = await apiClient.delete<{ success: boolean }>(`/layers/${id}`);
  return response.data;
}

/**
 * Update layer order
 */
export async function updateLayerOrder(countyId: string, layerIds: string[]) {
  const response = await apiClient.post<{ success: boolean }>(`/counties/${countyId}/layers/order`, { layerIds });
  return response.data;
}

/**
 * Toggle layer visibility
 */
export async function toggleLayerVisibility(id: string, visible: boolean) {
  const response = await apiClient.patch<Layer>(`/layers/${id}/visibility`, { visible });
  return response.data;
}

/**
 * Update layer style
 */
export async function updateLayerStyle(id: string, style: Layer['style']) {
  const response = await apiClient.patch<Layer>(`/layers/${id}/style`, { style });
  return response.data;
}

/**
 * Import a layer from a file (GeoJSON, Shapefile, etc.)
 */
export async function importLayerFromFile(countyId: string, file: File, options?: {
  name?: string;
  description?: string;
  type?: Layer['type'];
  style?: Layer['style'];
}) {
  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);
  
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
  }

  const response = await fetch(`${apiClient['baseUrl']}/counties/${countyId}/layers/import`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to import layer');
  }

  return response.json();
}

/**
 * Get layer feature count
 */
export async function getLayerFeatureCount(id: string) {
  const response = await apiClient.get<{ count: number }>(`/layers/${id}/features/count`);
  return response.data;
}

/**
 * Get layer features (paginated)
 */
export async function getLayerFeatures(id: string, options?: {
  limit?: number;
  offset?: number;
  bbox?: [number, number, number, number]; // min_x, min_y, max_x, max_y
}) {
  const response = await apiClient.get<{
    features: GeoJSON.Feature[];
    total: number;
  }>(`/layers/${id}/features`, {
    params: options as Record<string, string | number | boolean | undefined>
  });
  return response.data;
}