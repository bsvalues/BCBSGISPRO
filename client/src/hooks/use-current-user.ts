import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Current user interface
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  lastLogin: string | null;
}

/**
 * Hook to get and manage the current logged-in user
 */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  
  // Fetch current user data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/user/current'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/current');
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated
            return null;
          }
          throw new Error(`Failed to fetch current user: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
      }
    }
  });
  
  // Update user state when data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    } else {
      setUser(null);
    }
  }, [data]);
  
  // Login function
  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }
      
      const userData = await response.json();
      setUser(userData);
      refetch(); // Refresh the current user data
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during login'
      };
    }
  }, [refetch]);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.statusText}`);
      }
      
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred during logout'
      };
    }
  }, []);
  
  return {
    user,
    isLoading,
    error,
    login,
    logout,
    refetch
  };
}