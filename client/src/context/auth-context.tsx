import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// User type based on our schema.ts definition
interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode | ((context: AuthContextType) => ReactNode) }) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch the current user
  const { data: user, isLoading: isFetchingUser } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  // Login function - make POST request to login endpoint
  const login = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Invalidate the user query to refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        window.location.href = '/professional-demo'; // Redirect to dashboard after login
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function - redirects to Replit Auth logout endpoint
  const logout = () => {
    window.location.href = '/api/logout';
  };
  
  const value: AuthContextType = {
    user: user || null,
    isLoading: isLoading || isFetchingUser,
    isAuthenticated: !!user,
    login,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}