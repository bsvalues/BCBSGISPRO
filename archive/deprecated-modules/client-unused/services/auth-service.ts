import { demoUsers } from '../data/demo-property-data';

// Simple user type for demo
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string;
  department: string;
  permissions: string[];
  lastLogin: Date;
}

// Auth service for BentonGeoPro demo application
class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;

  // Check if a user is logged in
  public isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  // Get the current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  // Demo login with username/password against our demo user database
  public async login(username: string, password: string): Promise<User | null> {
    // Find the user with matching credentials
    const user = demoUsers.find(
      (u) => u.username === username && u.password === password
    );
    
    if (user) {
      // Omitting password field for security
      const { password: _, ...userWithoutPassword } = user;
      this.currentUser = userWithoutPassword as User;
      this.isAuthenticated = true;
      
      // Set auth token in localStorage (demo purposes only)
      localStorage.setItem('auth_token', btoa(JSON.stringify(this.currentUser)));
      
      return this.currentUser;
    }
    
    return null;
  }
  
  // Demo logout
  public async logout(): Promise<void> {
    this.currentUser = null;
    this.isAuthenticated = false;
    
    // Clear auth token from localStorage
    localStorage.removeItem('auth_token');
  }
  
  // Check if user has a specific permission
  public hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes(permission);
  }
  
  // Attempt to restore user session from localStorage
  public attemptSessionRestore(): boolean {
    const authToken = localStorage.getItem('auth_token');
    
    if (authToken) {
      try {
        const userData = JSON.parse(atob(authToken));
        // Convert string date back to Date object
        userData.lastLogin = new Date(userData.lastLogin);
        this.currentUser = userData;
        this.isAuthenticated = true;
        return true;
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.logout();
      }
    }
    
    return false;
  }
}

// Export singleton instance
export const authService = new AuthService();