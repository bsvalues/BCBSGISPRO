import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../context/auth-context';

interface AuthenticatedRouteProps {
  component: React.ComponentType<any>;
  path?: string;
  [x: string]: any;
}

export const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // If authentication is still being determined, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Preserve the intended destination in the URL for redirection after login
    const returnPath = encodeURIComponent(location);
    setLocation(`/login?returnTo=${returnPath}`);
    return null;
  }
  
  // Otherwise, render the protected component
  return <Component {...rest} />;
};