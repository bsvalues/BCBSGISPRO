import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/auth-context';

type ProtectedRouteProps = {
  component: React.ComponentType<any>;
  [key: string]: any;
};

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

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
    // For Replit Auth, we redirect to the root which will show the landing page
    // with a login button that triggers the auth flow
    window.location.href = '/';
    return null;
  }

  // If authenticated, render the protected component
  return <Component {...rest} />;
};

export default ProtectedRoute;