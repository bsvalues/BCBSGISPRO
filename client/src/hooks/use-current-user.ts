/**
 * Current User Hook
 * 
 * A hook to access the current authenticated user information.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Query for user data
  const { data, isError, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false
  });

  // Update local state when query completes
  useEffect(() => {
    if (data && !isError) {
      setUser(data);
      setIsLoading(false);
      setError(null);
    } else if (isError) {
      setUser(null);
      setIsLoading(false);
      setError(new Error('Failed to fetch user data'));
    } else if (!queryLoading) {
      // No data but no error - user is not authenticated
      setUser(null);
      setIsLoading(false);
      setError(null);
    }
  }, [data, isError, queryLoading]);

  // Handle user login
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      await refetch();
      return userData;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [refetch]);

  // Handle user logout
  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setUser(null);
      await refetch();
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [refetch]);

  // For development - mock a user if none exists
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isLoading && !user) {
      // Create a mock user for development if needed
      const mockUser = {
        id: 1,
        username: 'demo_user',
        email: 'demo@example.com',
        fullName: 'Demo User'
      };
      setUser(mockUser);
    }
  }, [isLoading, user]);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    refetch
  };
}