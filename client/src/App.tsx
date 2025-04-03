import { Switch, Route, Link, useLocation } from "wouter";
import MapViewerPage from "@/pages/map-viewer-page";
import CartographerToolsPage from "@/pages/cartographer-tools-page";
import GeospatialAnalysisPage from "@/pages/geospatial-analysis-page";
import ProgressTrackerDemo from "@/pages/progress-tracker-demo";
import ErrorHandlingPage from "./pages/error-handling-page";
import FullScreenMapPage from "@/pages/full-screen-map-page";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Map, 
  Ruler, 
  GitPullRequest, 
  AlertTriangle, 
  Maximize 
} from "lucide-react";
import ErrorBoundary from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast-provider";

/**
 * Simplified app that doesn't require authentication 
 * This directly renders the pages with mapping functionality
 */
function App() {
  const [location] = useLocation();
  
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 shadow-md">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-2">BentonGeoPro</h1>
            <p className="text-sm opacity-80 mb-4">GIS Workflow Solution</p>
            
            {/* Navigation Menu */}
            <nav className="flex flex-wrap gap-2">
              <Link href="/cartographer-tools">
                <Button 
                  variant={location === "/" || location === "/cartographer-tools" ? "secondary" : "outline"} 
                  size="sm"
                >
                  <Map className="mr-1 h-4 w-4" />
                  Cartographer Tools
                </Button>
              </Link>
              
              <Link href="/map-viewer">
                <Button 
                  variant={location === "/map-viewer" ? "secondary" : "outline"} 
                  size="sm"
                >
                  <MapPin className="mr-1 h-4 w-4" />
                  Map Viewer
                </Button>
              </Link>
              
              <Link href="/fullscreen-map">
                <Button 
                  variant={location === "/fullscreen-map" ? "secondary" : "outline"} 
                  size="sm"
                >
                  <Maximize className="mr-1 h-4 w-4" />
                  Fullscreen Map
                </Button>
              </Link>
              
              <Link href="/geospatial-analysis">
                <Button 
                  variant={location === "/geospatial-analysis" ? "secondary" : "outline"} 
                  size="sm"
                >
                  <Ruler className="mr-1 h-4 w-4" />
                  Geospatial Analysis
                </Button>
              </Link>
              
              <Link href="/progress-tracker">
                <Button 
                  variant={location === "/progress-tracker" ? "secondary" : "outline"} 
                  size="sm"
                >
                  <GitPullRequest className="mr-1 h-4 w-4" />
                  Progress Tracker
                </Button>
              </Link>
              
              <Link href="/error-handling">
                <Button 
                  variant={location === "/error-handling" ? "secondary" : "outline"} 
                  size="sm"
                >
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  Error Handling Demo
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto p-4 flex-grow">
          <ErrorBoundary>
            <Switch>
              {/* Map-related tools - No authentication required */}
              <Route path="/" component={CartographerToolsPage} />
              <Route path="/map-viewer" component={MapViewerPage} />
              <Route path="/fullscreen-map" component={FullScreenMapPage} />
              <Route path="/geospatial-analysis" component={GeospatialAnalysisPage} />
              <Route path="/cartographer-tools" component={CartographerToolsPage} />
              <Route path="/progress-tracker" component={ProgressTrackerDemo} />
              <Route path="/error-handling" component={ErrorHandlingPage} />
              
              {/* Default to the cartographer tools */}
              <Route>
                <CartographerToolsPage />
              </Route>
            </Switch>
          </ErrorBoundary>
        </main>
        
        <footer className="bg-primary/10 p-4 text-center text-sm mt-auto">
          <div className="container mx-auto">
            <p>BentonGeoPro &copy; 2025 - GIS Workflow Solution</p>
            <p className="text-xs mt-1 text-muted-foreground">Simplified Development Mode</p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
