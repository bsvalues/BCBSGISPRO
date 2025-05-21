/**
 * Authentication API service
 * 
 * This module provides functions for interacting with the Authentication API endpoints.
 * It uses the core ApiClient to handle HTTP requests and standardizes the interface
 * for authentication-related operations.
 */

import { apiClient } from './api';
import { User } from './users';

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Login with username and password
 */
export async function login(credentials: LoginCredentials) {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  
  // Store the token in the ApiClient for future requests
  if (response.data && response.data.token) {
    apiClient.setAuthToken(response.data.token);
    
    // Optionally store the token in localStorage for persistent sessions
    if (credentials.rememberMe) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('token_expires', response.data.expiresAt);
    }
  }
  
  return response.data;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData) {
  const response = await apiClient.post<User>('/auth/register', data);
  return response.data;
}

/**
 * Logout the current user
 */
export async function logout() {
  // Clear the token from localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token_expires');
  
  // Clear the token from the ApiClient
  apiClient.setAuthToken(null);
  
  // Call the logout endpoint to invalidate the token on the server
  const response = await apiClient.post<{ success: boolean }>('/auth/logout', {});
  return response.data;
}

/**
 * Check if the user is logged in
 */
export function isLoggedIn(): boolean {
  const token = localStorage.getItem('auth_token');
  const expires = localStorage.getItem('token_expires');
  
  if (!token || !expires) {
    return false;
  }
  
  // Check if the token is expired
  const expiresDate = new Date(expires);
  if (expiresDate <= new Date()) {
    // Token is expired, clear it
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires');
    apiClient.setAuthToken(null);
    return false;
  }
  
  // Set the token in the ApiClient
  apiClient.setAuthToken(token);
  return true;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string) {
  const response = await apiClient.post<{ success: boolean }>('/auth/verify-email', { token });
  return response.data;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  const response = await apiClient.post<{ success: boolean }>('/auth/resend-verification', { email });
  return response.data;
}

/**
 * Check authentication status
 * This is useful for verifying if the current token is still valid
 */
export async function checkAuthStatus() {
  try {
    const response = await apiClient.get<{
      authenticated: boolean;
      user?: User;
    }>('/auth/status');
    return response.data;
  } catch (error) {
    // Clear token on authentication error
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expires');
    apiClient.setAuthToken(null);
    return { authenticated: false };
  }
}

/**
 * Initialize authentication from localStorage
 * Call this when your application starts
 */
export function initAuth(): boolean {
  return isLoggedIn();
}