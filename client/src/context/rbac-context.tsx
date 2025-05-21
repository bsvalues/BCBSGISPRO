import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './auth-context';

// Define available roles in the system
export type UserRole = 'admin' | 'assessor' | 'clerk' | 'analyst' | 'viewer';

interface RbacContextType {
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  userRoles: UserRole[];
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export const RbacProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Extract user roles from the user object
  // This assumes roles are stored in the user object from the authentication system
  const userRoles: UserRole[] = React.useMemo(() => {
    if (!user || !isAuthenticated) return [];
    
    // If user has roles defined, use those, otherwise assign default 'viewer' role
    // We need to cast user to any since TypeScript doesn't recognize the roles property yet
    const roles = (user as any).roles || ['viewer'];
    return roles;
  }, [user, isAuthenticated]);
  
  // Check if user has any of the specified roles
  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // If no specific roles are required, any authenticated user passes
    if (roles.length === 0) return true;
    
    // Check if user has any of the required roles
    return roles.some(role => userRoles.includes(role));
  };
  
  return (
    <RbacContext.Provider value={{ hasRole, userRoles }}>
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = (): RbacContextType => {
  const context = useContext(RbacContext);
  
  if (context === undefined) {
    throw new Error('useRbac must be used within a RbacProvider');
  }
  
  return context;
};