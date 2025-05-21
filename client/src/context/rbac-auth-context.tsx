import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { apiRequest } from '../lib/queryClient';

// Define the User type with role-based properties
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  permissions: string[];
  lastLogin: string | null;
  isActive: boolean;
}

// Define the auth context state
interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Create the auth context
const RbacAuthContext = createContext<AuthContextState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: () => Promise.resolve(false),
  logout: () => {},
  hasRole: () => false,
  hasPermission: () => false
});

// Provider component for the auth context
export const RbacAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to check if the JWT token has expired
  const isTokenExpired = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiryTime;
    } catch (e) {
      return true; // If there's an error parsing the token, consider it expired
    }
  };

  // Initialize auth state from local storage when the component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (token && !isTokenExpired(token)) {
          // Token exists and is not expired, get user info
          const response = await apiRequest('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.success) {
            setUser(response.data);
            setIsLoading(false);
          } else {
            // API call was successful but user info couldn't be retrieved
            localStorage.removeItem('authToken');
            setUser(null);
            setIsLoading(false);
          }
        } else {
          // No token or expired token
          localStorage.removeItem('authToken'); // Clean up expired token
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        localStorage.removeItem('authToken');
        setUser(null);
        setError('Failed to initialize authentication');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        return true;
      } else {
        setError(response.message || 'Invalid username or password');
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  // Check if user has a specific role or any of the given roles
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    
    return roles.includes(user.role);
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Context value to be provided
  const contextValue: AuthContextState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    hasRole,
    hasPermission
  };

  return (
    <RbacAuthContext.Provider value={contextValue}>
      {children}
    </RbacAuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useRbacAuth = () => useContext(RbacAuthContext);