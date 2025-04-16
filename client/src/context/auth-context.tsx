import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/auth-service';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Attempt to restore session on mount
    const isSessionRestored = authService.attemptSessionRestore();
    if (isSessionRestored) {
      setUser(authService.getCurrentUser());
      setIsLoggedIn(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await authService.login(username, password);
      
      if (loggedInUser) {
        setUser(loggedInUser);
        setIsLoggedIn(true);
        
        addToast({
          title: 'Login Successful',
          description: `Welcome back, ${loggedInUser.fullName}!`,
          type: 'success',
        });
        
        return true;
      }
      
      addToast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        type: 'error',
      });
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      addToast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
      
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setIsLoggedIn(false);
      
      addToast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
        type: 'info',
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      addToast({
        title: 'Logout Error',
        description: 'An error occurred during logout.',
        type: 'error',
      });
    }
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const value = {
    user,
    login,
    logout,
    isLoggedIn,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};