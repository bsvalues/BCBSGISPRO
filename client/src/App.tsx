import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import WorkflowPage from "@/pages/workflow-page";
import MapViewerPage from "@/pages/map-viewer-page";
import ParcelGeneratorPage from "@/pages/parcel-generator-page";
import PropertySearchPage from "@/pages/property-search-page";
import ReportPage from "@/pages/report-page";
import DocumentClassificationPage from "@/pages/document-classification-page";

// Simple Router for development with no auth requirements
function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={HomePage} />
      <Route path="/workflow/:type" component={WorkflowPage} />
      <Route path="/map-viewer" component={MapViewerPage} />
      <Route path="/parcel-generator" component={ParcelGeneratorPage} />
      <Route path="/property-search" component={PropertySearchPage} />
      <Route path="/report" component={ReportPage} />
      <Route path="/document-classification" component={DocumentClassificationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
