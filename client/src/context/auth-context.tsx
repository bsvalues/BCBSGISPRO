import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch the current user
  const { data: user, isLoading: isFetchingUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Email login handler
  const loginWithEmail = async (email: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, provider: 'email' }),
    });
    
    if (!response.ok) {
      throw new Error('Email login failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data.user;
  };
  
  // OAuth provider login handlers
  const loginWithProvider = async (provider: string): Promise<User> => {
    // For demonstration purposes, prompt for email
    const email = prompt(`Enter your ${provider} email:`, 'user@example.com');
    
    if (!email) {
      throw new Error('Login canceled');
    }
    
    const response = await fetch(`/api/auth/${provider}?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      throw new Error(`${provider} login failed`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data.user;
  };
  
  // General login function
  const login = async (provider: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      let userData;
      
      if (provider === 'email') {
        const email = prompt('Enter your email address:', 'user@example.com');
        if (!email) {
          setIsLoading(false);
          throw new Error('Login canceled');
        }
        userData = await loginWithEmail(email);
      } else {
        userData = await loginWithProvider(provider);
      }
      
      // Invalidate auth queries to refresh user state
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await fetch('/api/auth/logout');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const value: AuthContextType = {
    user: (user as User) || null,
    isLoading: isLoading || isFetchingUser,
    isAuthenticated: !!user,
    login,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
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