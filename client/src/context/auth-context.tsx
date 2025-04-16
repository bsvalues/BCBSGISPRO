import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { authService, User } from '../services/auth-service';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      const restored = authService.attemptSessionRestore();
      if (restored) {
        setUser(authService.getCurrentUser());
        setIsAuthenticated(true);
      }
      setIsAuthenticating(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (username: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const user = await authService.login(username, password);
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        setLocation('/dashboard');
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.fullName}!`,
          type: "success",
        });
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          type: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An error occurred during login. Please try again.",
        type: "error",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setLocation('/');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      type: "info",
    });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        isAuthenticating
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};