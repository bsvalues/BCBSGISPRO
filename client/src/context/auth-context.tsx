import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useCurrentUser } from '../hooks/use-current-user';

// Define the Authentication Context interface
interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<boolean>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => null,
  logout: async () => false
});

// Export the hook to use this context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading, login, logout } = useCurrentUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update authentication state when user data changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;