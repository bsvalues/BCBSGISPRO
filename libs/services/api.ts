/**
 * Core API client for TerraFusion platform
 * 
 * This module provides the base API client functionality that other service modules will use
 * to make HTTP requests to the backend. It handles common concerns like:
 * - Authentication
 * - Error handling
 * - Request/response formatting
 * - Retries and timeouts
 */

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    totalPages?: number;
    totalItems?: number;
  };
}

/**
 * API error class
 */
export class ApiError extends Error {
  code: string;
  details?: any;
  status?: number;

  constructor(message: string, code: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Base API client class
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = '/api',
    defaultHeaders: Record<string, string> = {},
    defaultTimeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...defaultHeaders,
    };
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * GET request
   */
  async get<T>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(
    path: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: string,
    path: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session authentication
    };

    // Add request body for methods that support it
    if (data !== undefined && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Add abort signal
    if (options.signal) {
      fetchOptions.signal = options.signal;
    } else {
      // Setup timeout
      const controller = new AbortController();
      fetchOptions.signal = controller.signal;
      
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || this.defaultTimeout
      );

      // Clean up timeout on component unmount
      fetchOptions.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
      });
    }

    try {
      // Make the request
      const response = await fetch(url.toString(), fetchOptions);
      
      // Parse response
      let responseData: ApiResponse<T>;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // Handle non-JSON responses (like file downloads)
        const text = await response.text();
        responseData = {
          success: response.ok,
          data: text as any,
        };
      }

      // Handle unsuccessful responses
      if (!response.ok) {
        const error = responseData.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        };
        
        throw new ApiError(
          error.message,
          error.code,
          response.status,
          error.details
        );
      }

      return responseData;
    } catch (error: any) {
      // Handle aborted requests
      if (error.name === 'AbortError') {
        throw new ApiError(
          'Request timed out',
          'REQUEST_TIMEOUT',
          408
        );
      }
      
      // Rethrow ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle other errors
      throw new ApiError(
        error.message || 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export a customizable factory function
export function createApiClient(
  baseUrl?: string,
  defaultHeaders?: Record<string, string>,
  defaultTimeout?: number
): ApiClient {
  return new ApiClient(baseUrl, defaultHeaders, defaultTimeout);
}