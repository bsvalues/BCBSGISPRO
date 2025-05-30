import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './auth-context';

// Define available roles in the system
export type UserRole = 'admin' | 'staff' | 'field' | 'readonly' | 'public';

// Define permissions for specific actions
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'assign' | 'export';

interface RbacContextType {
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  userRoles: UserRole[];
  userPermissions: Permission[];
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export const RbacProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Define role-permission mappings
  const rolePermissionMap = React.useMemo(() => ({
    'admin': ['create', 'read', 'update', 'delete', 'approve', 'assign', 'export'],
    'staff': ['create', 'read', 'update', 'approve'],
    'field': ['read', 'update', 'create'],
    'readonly': ['read'],
    'public': ['read']
  }), []);
  
  // Extract user roles from the user object
  const userRoles: UserRole[] = React.useMemo(() => {
    if (!user || !isAuthenticated) return [];
    
    // If user has roles defined, use those, otherwise assign default 'public' role
    // We need to cast user to any since TypeScript doesn't recognize the roles property yet
    const roles = (user as any).roles || ['public'];
    return roles;
  }, [user, isAuthenticated]);
  
  // Calculate user permissions based on their roles
  const userPermissions: Permission[] = React.useMemo(() => {
    if (!userRoles.length) return [];
    
    // Collect all permissions from all roles
    const permissions = new Set<Permission>();
    
    userRoles.forEach(role => {
      if (role in rolePermissionMap) {
        rolePermissionMap[role as keyof typeof rolePermissionMap].forEach(permission => {
          permissions.add(permission as Permission);
        });
      }
    });
    
    return Array.from(permissions);
  }, [userRoles, rolePermissionMap]);
  
  // Check if user has any of the specified roles
  const hasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // If no specific roles are required, any authenticated user passes
    if (roles.length === 0) return true;
    
    // Check if user has any of the required roles
    return roles.some(role => userRoles.includes(role));
  };
  
  // Check if user has any of the specified permissions
  const hasPermission = (requiredPermissions: Permission | Permission[]): boolean => {
    if (!isAuthenticated) return false;
    
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    // If no specific permissions are required, any authenticated user passes
    if (permissions.length === 0) return true;
    
    // Check if user has any of the required permissions
    return permissions.some(permission => userPermissions.includes(permission));
  };
  
  return (
    <RbacContext.Provider value={{ hasRole, hasPermission, userRoles, userPermissions }}>
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