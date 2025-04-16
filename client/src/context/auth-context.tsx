import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, User } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';

// AuthContext interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  hasPermission: () => false,
});

// Auth Provider Props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Attempt to restore session on component mount
  useEffect(() => {
    const sessionRestored = authService.attemptSessionRestore();
    if (sessionRestored) {
      setUser(authService.getCurrentUser());
      setIsAuthenticated(true);
    }
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const user = await authService.login(username, password);
      
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.fullName}!`,
          variant: 'success',
        });
        return true;
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Error',
        description: 'An error occurred during logout.',
        variant: 'destructive',
      });
    }
  };
  
  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };
  
  // Provide the context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);