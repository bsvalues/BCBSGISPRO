import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "./queryClient";
import { useEffect, useState } from "react";
import { queryClient } from "./queryClient";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);
  const [, setLocation] = useLocation();

  // Get current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Auto-login in development mode
  useEffect(() => {
    // If no user and in dev mode and haven't attempted auto-login yet
    if (!user && import.meta.env.DEV && !isAutoLoginAttempted) {
      setIsAutoLoginAttempted(true);
      
      const performAutoLogin = async () => {
        try {
          // Use fetch directly for better control
          const response = await fetch("/api/dev-login", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) {
            throw new Error("Auto-login failed");
          }
          
          const userData = await response.json();
          
          // Update the cache
          queryClient.setQueryData(["/api/user"], userData);
        } catch (error) {
          console.error("Auto-login error:", error);
        }
      };
      
      performAutoLogin();
    }
  }, [user, isAutoLoginAttempted]);

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // If in dev mode and attempting auto-login but no user yet, show spinner
  if (import.meta.env.DEV && isAutoLoginAttempted && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Auto-logging in...</p>
        </div>
      </div>
    );
  }

  // Render route
  return (
    <Route path={path}>
      {user ? <Component /> : <Redirect to="/auth" />}
    </Route>
  );
}