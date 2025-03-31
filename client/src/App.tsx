import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import WorkflowPage from "@/pages/workflow-page";
import MapViewerPage from "@/pages/map-viewer-page";
import ParcelGeneratorPage from "@/pages/parcel-generator-page";
import PropertySearchPage from "@/pages/property-search-page";
import ReportPage from "@/pages/report-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/workflow/:type" component={WorkflowPage} />
      <ProtectedRoute path="/map-viewer" component={MapViewerPage} />
      <ProtectedRoute path="/parcel-generator" component={ParcelGeneratorPage} />
      <ProtectedRoute path="/property-search" component={PropertySearchPage} />
      <ProtectedRoute path="/report" component={ReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
