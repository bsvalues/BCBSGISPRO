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
          console.log("Attempting auto-login...");
          
          // Clear any existing cookies by setting a new session
          document.cookie = 'bentoncounty.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

          // Add some delay to ensure cookie clearing takes effect
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Use fetch directly with proper cache control
          const response = await fetch("/api/dev-login", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store",
              "Pragma": "no-cache"
            },
            cache: "no-store"
          });
          
          if (!response.ok) {
            console.error("Auto-login response not OK:", response.status, response.statusText);
            throw new Error("Auto-login failed");
          }
          
          const userData = await response.json();
          console.log("Auto-login successful, user data:", userData);
          
          // Update the cache
          queryClient.setQueryData(["/api/user"], userData);
          
          // Add a slight delay before verifying the session
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify the session was established correctly
          try {
            const verifyResponse = await fetch("/api/user", {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: {
                "Cache-Control": "no-cache, no-store",
                "Pragma": "no-cache"
              }
            });
            
            if (verifyResponse.ok) {
              console.log("Session verified successfully");
              const verifiedUser = await verifyResponse.json();
              console.log("Verified user:", verifiedUser);
              
              // Double-update the cache to ensure it's synced
              queryClient.setQueryData(["/api/user"], verifiedUser);
            } else {
              console.error("Session verification failed:", verifyResponse.status);
              // Try one more time after a longer delay
              setTimeout(async () => {
                try {
                  const retryResponse = await fetch("/api/user", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                  });
                  
                  if (retryResponse.ok) {
                    const retryUser = await retryResponse.json();
                    console.log("Session verified on retry:", retryUser);
                    queryClient.setQueryData(["/api/user"], retryUser);
                  }
                } catch (err) {
                  console.error("Error on retry verification:", err);
                }
              }, 300);
            }
          } catch (err) {
            console.error("Error verifying session:", err);
          }
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

  // Render route - DEVELOPMENT MODE BYPASS
  // In development mode, bypass authentication completely
  return (
    <Route path={path}>
      {import.meta.env.DEV || user ? <Component /> : <Redirect to="/auth" />}
    </Route>
  );
}