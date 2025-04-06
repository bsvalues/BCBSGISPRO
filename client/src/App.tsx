import { Switch, Route, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import MapViewerPage from "@/pages/map-viewer-page";
import CartographerToolsPage from "@/pages/cartographer-tools-page";
import GeospatialAnalysisPage from "@/pages/geospatial-analysis-page";
import ProgressTrackerDemo from "@/pages/progress-tracker-demo";
import ProjectProgressPage from "@/pages/project-progress";
import ErrorHandlingPage from "./pages/error-handling-page";
import FullScreenMapPage from "@/pages/full-screen-map-page";
import ToastTestPage from "@/pages/toast-test-page";
import MapboxDemoPage from "@/pages/mapbox-demo-page";
import LegalDescriptionAgentPage from "@/pages/legal-description-agent-page";
import LegalDescriptionDemo from "@/pages/legal-description-demo";
import WebSocketDemoPage from "@/pages/websocket-demo-page";
import { CollaborativeWorkspacePage } from "@/pages/collaborative-workspace-page";
import CollaborativeFeaturesDemo from "@/pages/collaborative-features-demo";
import WebSocketTestPage from "@/pages/websocket-test";
import CollaborativeMapDemoPage from "@/pages/collaborative-map-demo";
import MapCollaborationDemoPage from "@/pages/map-collaboration-demo-page";
import EnhancedMapCollaborationPage from "@/pages/enhanced-map-collaboration-page";
import MapCollaborationStarterPage from "@/pages/map-collaboration-starter-page";
import DocumentParcelManagementPage from "@/pages/document-parcel-management";
import DataMigrationPage from "@/pages/data-migration";
import { MapSettingsPage } from "@/pages/map-settings";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MapPin, 
  Map, 
  Ruler, 
  GitPullRequest, 
  AlertTriangle, 
  Maximize,
  BellRing,
  Globe,
  FileText,
  MessagesSquare,
  Users,
  Share2,
  BarChart,
  Database,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Settings
} from "lucide-react";
import ErrorBoundary from "@/components/ui/error-boundary";

/**
 * Modernized app with immersive layout and collapsible navigation
 */
function App() {
  const [location] = useLocation();
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Handle scroll events to auto-collapse header on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      
      // Auto-collapse header when scrolling down past 100px
      if (position > 100 && !headerCollapsed) {
        setHeaderCollapsed(true);
      } else if (position < 50 && headerCollapsed) {
        setHeaderCollapsed(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headerCollapsed]);
  
  // Check if current route is a map page that should be immersive
  const isImmersiveMapPage = [
    '/fullscreen-map', 
    '/map-collaboration-demo', 
    '/enhanced-map-collaboration',
    '/collaborative-map',
    '/map-viewer',
    '/mapbox-demo'
  ].includes(location);

  // Featured navigation links
  const featuredLinks = [
    { 
      path: '/fullscreen-map', 
      icon: <Maximize className="h-4 w-4" />, 
      label: 'Immersive Map',
      description: 'Full screen map with advanced controls' 
    },
    { 
      path: '/cartographer-tools', 
      icon: <Map className="h-4 w-4" />, 
      label: 'Cartographer Tools',
      description: 'Professional mapping toolset' 
    },
    { 
      path: '/enhanced-map-collaboration', 
      icon: <Share2 className="h-4 w-4" />, 
      label: 'Collaborative Mapping',
      description: 'Real-time map collaboration' 
    },
    { 
      path: '/geospatial-analysis', 
      icon: <Ruler className="h-4 w-4" />, 
      label: 'Geospatial Analysis',
      description: 'Advanced spatial analytics' 
    },
  ];

  // Additional navigation links
  const additionalLinks = [
    { 
      path: '/collaborative-workspace', 
      icon: <Users className="h-4 w-4" />, 
      label: 'Collaborative Workspace',
    },
    { 
      path: '/document-parcel-management', 
      icon: <FileText className="h-4 w-4" />, 
      label: 'Document Management',
    },
    { 
      path: '/map-viewer', 
      icon: <MapPin className="h-4 w-4" />, 
      label: 'Map Viewer',
    },
    { 
      path: '/mapbox-demo', 
      icon: <Globe className="h-4 w-4" />, 
      label: 'Mapbox Demo',
    },
    { 
      path: '/map-settings', 
      icon: <Settings className="h-4 w-4" />, 
      label: 'Map Settings',
    },
    { 
      path: '/progress-tracker', 
      icon: <GitPullRequest className="h-4 w-4" />, 
      label: 'Progress Tracker',
    },
    { 
      path: '/project-progress', 
      icon: <BarChart className="h-4 w-4" />, 
      label: 'Project Progress',
    },
    { 
      path: '/legal-description-agent', 
      icon: <FileText className="h-4 w-4" />, 
      label: 'Legal Description',
    },
    { 
      path: '/data-migration', 
      icon: <Database className="h-4 w-4" />, 
      label: 'Data Migration',
    },
  ];
  
  return (
    <div className={`min-h-screen flex flex-col ${isImmersiveMapPage ? 'overflow-hidden' : ''}`}>
      {/* Fixed position header that collapses */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          headerCollapsed ? 'h-14' : 'h-auto'
        } ${
          isImmersiveMapPage ? 'glass-panel backdrop-blur-md bg-opacity-60' : 'bg-primary text-primary-foreground'
        }`}
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center bg-primary/20 p-1.5 rounded-full ${isImmersiveMapPage ? 'text-primary-700' : 'text-primary-foreground'}`}>
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h1 className={`font-bold text-xl ${isImmersiveMapPage ? 'readable-text' : ''}`}>BentonGeoPro</h1>
                {!headerCollapsed && (
                  <p className={`text-xs ${isImmersiveMapPage ? 'text-gray-700' : 'text-primary-foreground/80'}`}>
                    GIS Workflow Solution
                  </p>
                )}
              </div>
            </div>
            
            {/* Mobile menu toggle */}
            <div className="lg:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className={`p-1.5 ${isImmersiveMapPage ? 'hover:bg-white/20' : 'hover:bg-primary-foreground/10'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            {/* Desktop Navigation Menu - Featured Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {featuredLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <Button 
                    variant={location === link.path ? "default" : isImmersiveMapPage ? "ghost" : "outline"} 
                    size="sm"
                    className={isImmersiveMapPage ? 'btn-3d' : ''}
                  >
                    {link.icon}
                    <span className="ml-1.5">{link.label}</span>
                  </Button>
                </Link>
              ))}
              
              {/* Header collapse toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                className={`ml-2 ${isImmersiveMapPage ? 'btn-3d' : ''}`}
                aria-label={headerCollapsed ? "Expand header" : "Collapse header"}
              >
                {headerCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </nav>
          </div>
          
          {/* Extended header content - only visible when not collapsed */}
          {!headerCollapsed && (
            <div className="py-3 hidden lg:block">
              <div className="grid grid-cols-4 gap-4">
                {featuredLinks.map((link) => (
                  <Link key={link.path} href={link.path}>
                    <div 
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        location === link.path 
                          ? isImmersiveMapPage 
                            ? 'bg-white/30 shadow-md' 
                            : 'bg-primary-foreground/20' 
                          : isImmersiveMapPage 
                            ? 'hover:bg-white/20' 
                            : 'hover:bg-primary-foreground/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          isImmersiveMapPage 
                            ? 'bg-white/30 text-primary-700' 
                            : 'bg-primary-foreground/20'
                        }`}>
                          {link.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{link.label}</h3>
                          <p className={`text-xs ${
                            isImmersiveMapPage ? 'text-gray-700' : 'text-primary-foreground/70'
                          }`}>
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-1">
                {additionalLinks.map((link) => (
                  <TooltipProvider key={link.path}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={link.path}>
                          <Button 
                            variant={location === link.path 
                              ? "default" 
                              : isImmersiveMapPage ? "ghost" : "outline"
                            } 
                            size="sm"
                            className={isImmersiveMapPage ? 'btn-3d' : ''}
                          >
                            {link.icon}
                            <span className="ml-1">{link.label}</span>
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className={isImmersiveMapPage ? "tooltip-3d" : ""}
                      >
                        {link.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
          
          {/* Mobile menu - shown only when menu is open on mobile */}
          {mobileMenuOpen && (
            <div className="py-3 lg:hidden">
              <div className="space-y-2">
                {featuredLinks.map((link) => (
                  <Link key={link.path} href={link.path}>
                    <Button 
                      variant={location === link.path ? "default" : isImmersiveMapPage ? "ghost" : "outline"} 
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.icon}
                      <span className="ml-2">{link.label}</span>
                    </Button>
                  </Link>
                ))}
                
                <div className="border-t border-primary-foreground/10 my-2 pt-2">
                  {additionalLinks.map((link) => (
                    <Link key={link.path} href={link.path}>
                      <Button 
                        variant={location === link.path ? "default" : isImmersiveMapPage ? "ghost" : "outline"} 
                        size="sm"
                        className="w-full justify-start mt-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.icon}
                        <span className="ml-2">{link.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content area with spacer for fixed header */}
      <main 
        className={`flex-grow ${
          isImmersiveMapPage 
            ? 'pt-14 h-screen' // Only top padding for immersive pages
            : 'container mx-auto p-4 pt-24' // Full container with padding for regular pages
        }`}
      >
        <ErrorBoundary>
          <Switch>
            {/* Map-related tools - No authentication required */}
            <Route path="/" component={CartographerToolsPage} />
            <Route path="/map-viewer" component={MapViewerPage} />
            <Route path="/mapbox-demo" component={MapboxDemoPage} />
            <Route path="/fullscreen-map" component={FullScreenMapPage} />
            <Route path="/geospatial-analysis" component={GeospatialAnalysisPage} />
            <Route path="/cartographer-tools" component={CartographerToolsPage} />
            <Route path="/progress-tracker" component={ProgressTrackerDemo} />
            <Route path="/error-handling" component={ErrorHandlingPage} />
            <Route path="/toast-test" component={ToastTestPage} />
            <Route path="/legal-description-agent" component={LegalDescriptionAgentPage} />
            <Route path="/legal-description-demo" component={LegalDescriptionDemo} />
            <Route path="/websocket-demo" component={WebSocketDemoPage} />
            <Route path="/websocket-test" component={WebSocketTestPage} />
            <Route path="/collaborative-workspace" component={CollaborativeWorkspacePage} />
            <Route path="/collaborative-features" component={CollaborativeFeaturesDemo} />
            <Route path="/collaborative-map" component={CollaborativeMapDemoPage} />
            <Route path="/map-collaboration-demo" component={MapCollaborationDemoPage} />
            <Route path="/enhanced-map-collaboration" component={EnhancedMapCollaborationPage} />
            <Route path="/map-collaboration-starter" component={MapCollaborationStarterPage} />
            <Route path="/document-parcel-management" component={DocumentParcelManagementPage} />
            <Route path="/project-progress" component={ProjectProgressPage} />
            <Route path="/data-migration" component={DataMigrationPage} />
            <Route path="/map-settings" component={MapSettingsPage} />
            
            {/* Default to the fullscreen map page */}
            <Route>
              <FullScreenMapPage />
            </Route>
          </Switch>
        </ErrorBoundary>
      </main>
      
      {/* Footer - Only visible on non-immersive pages */}
      {!isImmersiveMapPage && (
        <footer className="bg-primary/10 p-4 text-center text-sm mt-auto">
          <div className="container mx-auto">
            <p>BentonGeoPro &copy; 2025 - GIS Workflow Solution</p>
            <p className="text-xs mt-1 text-muted-foreground">Simplified Development Mode</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
