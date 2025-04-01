import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import WorkflowPage from "@/pages/workflow-page";
import MapViewerPage from "@/pages/map-viewer-page";
import ParcelGeneratorPage from "@/pages/parcel-generator-page";
import PropertySearchPage from "@/pages/property-search-page";
import ReportPage from "@/pages/report-page";
import DocumentClassificationPage from "@/pages/document-classification-page";
import GeospatialAnalysisPage from "@/pages/geospatial-analysis-page";
import PublicPropertyPortal from "@/pages/public-property-portal";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Auto Login page for development
function DevAutoLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        console.log("Performing auto-login from dedicated route");
        
        // Use fetch directly for better control of credentials
        const response = await fetch("/api/dev-login", {
          method: "GET",
          credentials: "include", // This ensures cookies are sent with the request
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error("Auto login failed");
        }
        
        const userData = await response.json();
        console.log("Auto login successful:", userData);
        
        // Update the cache
        queryClient.setQueryData(["/api/user"], userData);
        
        // Show success message
        toast({
          title: "Auto-login successful",
          description: `Logged in as ${userData.fullName || userData.username}`,
        });
        
        // Verify the session by immediately checking user status
        const verifySession = async () => {
          try {
            const verifyResponse = await fetch("/api/user", {
              method: "GET",
              credentials: "include",
            });
            
            if (verifyResponse.ok) {
              console.log("Session verified successfully");
            } else {
              console.error("Session verification failed");
            }
          } catch (err) {
            console.error("Error verifying session:", err);
          }
        };
        
        await verifySession();
        
        // Redirect to home with a small delay to ensure state is updated
        setTimeout(() => {
          console.log("Navigating to homepage after auto-login");
          setLocation("/");
        }, 300); // Increase delay to allow for session establishment
      } catch (error) {
        console.error("Auto login error:", error);
        toast({
          title: "Auto-login failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
        setLocation("/auth");
      }
    };
    
    performAutoLogin();
  }, [setLocation, toast]);
  
  // Simple loading screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neutral-500">Auto logging in...</p>
      </div>
    </div>
  );
}

// Router with authentication
function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/properties" component={PublicPropertyPortal} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dev-login" component={DevAutoLogin} />
      
      {/* Authenticated routes */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/workflow/:type" component={WorkflowPage} />
      <ProtectedRoute path="/map-viewer" component={MapViewerPage} />
      <ProtectedRoute path="/parcel-generator" component={ParcelGeneratorPage} />
      <ProtectedRoute path="/property-search" component={PropertySearchPage} />
      <ProtectedRoute path="/report" component={ReportPage} />
      <ProtectedRoute path="/document-classification" component={DocumentClassificationPage} />
      <ProtectedRoute path="/geospatial-analysis" component={GeospatialAnalysisPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Auto-redirect to dev-login on initial load in development
    // Using import.meta.env for Vite environment variables
    if (import.meta.env.DEV) {
      console.log('Development mode detected, auto-redirecting to dev login');
      navigate('/dev-login');
    }
  }, [navigate]);
  
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
