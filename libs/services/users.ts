/**
 * Users API service
 * 
 * This module provides functions for interacting with the Users API endpoints.
 * It uses the core ApiClient to handle HTTP requests and standardizes the interface
 * for user-related operations.
 */

import { apiClient, ApiRequestOptions } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'assessor' | 'viewer' | 'county-admin';
  counties?: string[]; // Array of county IDs the user has access to
  department?: string;
  title?: string;
  active: boolean;
  lastLogin?: Date;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    mapProvider?: 'mapbox' | 'arcgis' | 'leaflet';
    defaultCounty?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilter {
  role?: User['role'];
  countyId?: string;
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: User['role'];
  counties?: string[];
  department?: string;
  title?: string;
  active?: boolean;
  preferences?: User['preferences'];
  metadata?: Record<string, any>;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: User['role'];
  counties?: string[];
  department?: string;
  title?: string;
  active?: boolean;
  preferences?: User['preferences'];
  metadata?: Record<string, any>;
}

/**
 * Get all users with optional filtering
 */
export async function getUsers(filters?: UserFilter) {
  const response = await apiClient.get<User[]>('/users', {
    params: filters as Record<string, string | number | boolean | undefined>
  });
  return response.data || [];
}

/**
 * Get a specific user by ID
 */
export async function getUser(id: string) {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserData) {
  const response = await apiClient.post<User>('/users', userData);
  return response.data;
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, userData: UpdateUserData) {
  const response = await apiClient.patch<User>(`/users/${id}`, userData);
  return response.data;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  const response = await apiClient.delete<{ success: boolean }>(`/users/${id}`);
  return response.data;
}

/**
 * Update current user profile
 */
export async function updateUserProfile(profileData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  preferences?: User['preferences'];
}) {
  const response = await apiClient.patch<User>('/users/me/profile', profileData);
  return response.data;
}

/**
 * Change user password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await apiClient.post<{ success: boolean }>('/users/me/change-password', data);
  return response.data;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  const response = await apiClient.post<{ success: boolean }>('/auth/reset-password', { email });
  return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(data: {
  token: string;
  newPassword: string;
}) {
  const response = await apiClient.post<{ success: boolean }>('/auth/reset-password/confirm', data);
  return response.data;
}

/**
 * Add county access to user
 */
export async function addCountyAccess(userId: string, countyId: string) {
  const response = await apiClient.post<User>(`/users/${userId}/counties/${countyId}`, {});
  return response.data;
}

/**
 * Remove county access from user
 */
export async function removeCountyAccess(userId: string, countyId: string) {
  const response = await apiClient.delete<User>(`/users/${userId}/counties/${countyId}`);
  return response.data;
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(userId: string, options?: {
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
  offset?: number;
}) {
  const response = await apiClient.get<Array<{
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    timestamp: Date;
    details?: any;
  }>>(`/users/${userId}/activity`, {
    params: options as Record<string, string | number | boolean | undefined>
  });
  return response.data || [];
}