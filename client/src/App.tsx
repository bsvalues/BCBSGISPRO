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

// Auto Login page for development
function DevAutoLogin() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        console.log("Performing auto-login from dedicated route");
        const response = await apiRequest("GET", "/api/dev-login");
        
        if (!response.ok) {
          throw new Error("Auto login failed");
        }
        
        const userData = await response.json();
        console.log("Auto login successful:", userData);
        
        // Update the cache
        queryClient.setQueryData(["/api/user"], userData);
        
        // Redirect to home
        setLocation("/");
      } catch (error) {
        console.error("Auto login error:", error);
        setLocation("/auth");
      }
    };
    
    performAutoLogin();
  }, [setLocation]);
  
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
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
