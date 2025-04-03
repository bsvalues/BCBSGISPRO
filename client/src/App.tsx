import { Switch, Route, Link, useLocation } from "wouter";
import MapViewerPage from "@/pages/map-viewer-page";
import CartographerToolsPage from "@/pages/cartographer-tools-page";
import GeospatialAnalysisPage from "@/pages/geospatial-analysis-page";
import ProgressTrackerDemo from "@/pages/progress-tracker-demo";
import { Button } from "@/components/ui/button";
import { MapPin, Map, Ruler, GitPullRequest } from "lucide-react";

/**
 * Simplified app that doesn't require authentication 
 * This directly renders the pages with mapping functionality
 */
function App() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-2">BentonGeoPro</h1>
          <p className="text-sm opacity-80 mb-4">GIS Workflow Solution</p>
          
          {/* Navigation Menu */}
          <nav className="flex flex-wrap gap-2">
            <Button 
              variant={location === "/" || location === "/cartographer-tools" ? "secondary" : "outline"} 
              size="sm"
              asChild
            >
              <Link href="/cartographer-tools">
                <Map className="mr-1 h-4 w-4" />
                Cartographer Tools
              </Link>
            </Button>
            
            <Button 
              variant={location === "/map-viewer" ? "secondary" : "outline"} 
              size="sm"
              asChild
            >
              <Link href="/map-viewer">
                <MapPin className="mr-1 h-4 w-4" />
                Map Viewer
              </Link>
            </Button>
            
            <Button 
              variant={location === "/geospatial-analysis" ? "secondary" : "outline"} 
              size="sm"
              asChild
            >
              <Link href="/geospatial-analysis">
                <Ruler className="mr-1 h-4 w-4" />
                Geospatial Analysis
              </Link>
            </Button>
            
            <Button 
              variant={location === "/progress-tracker" ? "secondary" : "outline"} 
              size="sm"
              asChild
            >
              <Link href="/progress-tracker">
                <GitPullRequest className="mr-1 h-4 w-4" />
                Progress Tracker
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 flex-grow">
        <Switch>
          {/* Map-related tools - No authentication required */}
          <Route path="/" component={CartographerToolsPage} />
          <Route path="/map-viewer" component={MapViewerPage} />
          <Route path="/geospatial-analysis" component={GeospatialAnalysisPage} />
          <Route path="/cartographer-tools" component={CartographerToolsPage} />
          <Route path="/progress-tracker" component={ProgressTrackerDemo} />
          
          {/* Default to the cartographer tools */}
          <Route>
            <CartographerToolsPage />
          </Route>
        </Switch>
      </main>
      
      <footer className="bg-primary/10 p-4 text-center text-sm mt-auto">
        <div className="container mx-auto">
          <p>BentonGeoPro &copy; 2025 - GIS Workflow Solution</p>
          <p className="text-xs mt-1 text-muted-foreground">Simplified Development Mode</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
