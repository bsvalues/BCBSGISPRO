/**
 * API Service
 * 
 * This module provides the core API functionality for making requests to our backend.
 */

/**
 * Configuration for API requests
 */
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Base API service for making HTTP requests to our API
 */
export class ApiService {
  /**
   * Base URL for API requests
   */
  private baseUrl = '/api/terraform';

  /**
   * Make an API request with proper error handling
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    
    // Set up default headers for JSON communication
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    
    // Convert body to JSON string if present
    const body = config.body ? JSON.stringify(config.body) : undefined;
    
    try {
      // Make the fetch request
      const response = await fetch(fullUrl, {
        method: config.method || 'GET',
        headers,
        body,
      });
      
      // Check if response is OK (status in the 200-299 range)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, errorData);
      }
      
      // For 204 No Content responses, return null
      if (response.status === 204) {
        return null as T;
      }
      
      // Parse and return JSON response
      return await response.json() as T;
    } catch (error) {
      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Otherwise, wrap in ApiError
      console.error('API request failed:', error);
      throw new ApiError(0, 'Network error', error);
    }
  }
  
  /**
   * Convenience method for GET requests
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  }
  
  /**
   * Convenience method for POST requests
   */
  async post<T = any>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'POST', body: data, headers });
  }
  
  /**
   * Convenience method for PUT requests
   */
  async put<T = any>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body: data, headers });
  }
  
  /**
   * Convenience method for DELETE requests
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }
  
  /**
   * Convenience method for PATCH requests
   */
  async patch<T = any>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'PATCH', body: data, headers });
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create and export a single instance of the API service
 */
export const apiService = new ApiService();