import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { demoUsers } from '../data/demo-property-data';

// Define the user type
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAuthenticating: false,
  login: () => {},
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [, setLocation] = useLocation();
  
  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('bentonGeoPro_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('bentonGeoPro_user');
      }
    }
  }, []);
  
  // Login function
  const login = (username: string, password: string) => {
    setIsAuthenticating(true);
    
    // Simulate API request with setTimeout
    setTimeout(() => {
      // Find user with matching credentials
      const foundUser = demoUsers.find(
        (user) => user.username === username && user.password === password
      );
      
      if (foundUser) {
        // Create user object without password
        const authenticatedUser: User = {
          id: foundUser.id,
          username: foundUser.username,
          fullName: foundUser.fullName,
          role: foundUser.role,
          permissions: foundUser.permissions || [],
        };
        
        // Set user in state and localStorage
        setUser(authenticatedUser);
        localStorage.setItem('bentonGeoPro_user', JSON.stringify(authenticatedUser));
        
        // Redirect to dashboard
        setLocation('/dashboard');
      } else {
        console.error('Invalid credentials');
        // In a real app, would show an error message
      }
      
      setIsAuthenticating(false);
    }, 800); // Simulate network delay
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('bentonGeoPro_user');
    setLocation('/');
  };
  
  // Provide auth context to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthenticating,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};