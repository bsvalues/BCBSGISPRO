import { useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  isLoggedIn: boolean;
}

// Simple hook to manage the current user
export function useUser() {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load from session storage
    const storedUser = sessionStorage.getItem('bg_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // If no user in session, generate a temporary one
    return {
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      username: `Guest_${Math.floor(Math.random() * 1000)}`,
      isLoggedIn: false
    };
  });
  
  // Save user to session storage when it changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('bg_user', JSON.stringify(user));
    }
  }, [user]);
  
  // Function to update user information
  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };
  
  // Function to log out
  const logout = () => {
    sessionStorage.removeItem('bg_user');
    // Set a new guest user
    setUser({
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      username: `Guest_${Math.floor(Math.random() * 1000)}`,
      isLoggedIn: false
    });
  };
  
  // Check if user is authenticated
  const isAuthenticated = !!user?.isLoggedIn;
  
  return { 
    user, 
    updateUser, 
    logout, 
    isAuthenticated 
  };
}