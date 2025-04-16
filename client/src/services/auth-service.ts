import { demoUserAccounts } from '@/data/demo-property-data';

// Auth types
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string; // Will be ignored in demo mode
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
}

/**
 * Demo authentication service
 * For the BentonGeoPro demo, we're using simplified auth with demo accounts
 */
export const authService = {
  /**
   * Login with demo user credentials
   */
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Find user by username (case insensitive)
    const user = demoUserAccounts.find(
      u => u.username.toLowerCase() === credentials.username.toLowerCase()
    );
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    // In demo mode, any password works for the demo users
    // But we simulate a proper authentication process
    
    // Convert user to AuthUser format
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions
    };
    
    // Store user in localStorage
    localStorage.setItem('bentongeopro_user', JSON.stringify(authUser));
    
    return authUser;
  },
  
  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Remove user from localStorage
    localStorage.removeItem('bentongeopro_user');
  },
  
  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): AuthUser | null => {
    const userJson = localStorage.getItem('bentongeopro_user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson) as AuthUser;
    } catch (error) {
      console.error('Error parsing user from localStorage', error);
      return null;
    }
  },
  
  /**
   * Check if user has a specific permission
   */
  hasPermission: (user: AuthUser | null, permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }
};

// Create a React hook for accessing the current auth state
export const useAuth = () => {
  const user = authService.getCurrentUser();
  
  return {
    user,
    isAuthenticated: !!user,
    hasPermission: (permission: string) => authService.hasPermission(user, permission),
    login: authService.login,
    logout: authService.logout
  };
};