import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/auth-context';
import { useRbac, UserRole } from '../../context/rbac-context';

type RoleProtectedRouteProps = {
  component: React.ComponentType<any>;
  roles?: UserRole | UserRole[];
  [key: string]: any;
};

/**
 * A wrapper component that protects routes requiring specific roles
 * Redirects to unauthorized page if user doesn't have required roles
 */
const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  component: Component,
  roles,
  ...rest
}) => {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { hasRole } = useRbac();

  // Show loading indicator while authentication state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const currentPath = window.location.pathname;
    setLocation(`/login?returnTo=${encodeURIComponent(currentPath)}`);
    return null;
  }

  // Check role-based access if roles are specified
  if (roles && !hasRole(roles)) {
    setLocation('/unauthorized');
    return null;
  }

  // If authenticated and authorized, render the protected component
  return <Component {...rest} />;
};

export default RoleProtectedRoute;