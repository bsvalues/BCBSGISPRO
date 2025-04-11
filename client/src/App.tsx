import { Switch, Route, Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
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
import DataQualityDashboardPage from "@/pages/data-quality-dashboard";
import ComplianceDashboardPage from "@/pages/compliance-dashboard";
import CollaborativeFeaturesDemo from "@/pages/collaborative-features-demo";
import WebSocketTestPage from "@/pages/websocket-test";
import CollaborativeMapDemoPage from "@/pages/collaborative-map-demo";
import MapCollaborationDemoPage from "@/pages/map-collaboration-demo-page";
import EnhancedMapCollaborationPage from "@/pages/enhanced-map-collaboration-page";
import MapCollaborationStarterPage from "@/pages/map-collaboration-starter-page";
import DocumentParcelManagementPage from "@/pages/document-parcel-management";
import DataMigrationPage from "@/pages/data-migration";
import { MapSettingsPage } from "@/pages/map-settings";
import ParcelComparisonDemo from "@/pages/parcel-comparison-demo";
import EsriMapPage from "./pages/EsriMapPage";
import AgentMasterPromptDemo from "@/pages/agent-master-prompt-demo";
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
  Settings,
  CheckCircle
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
  
  // All pages should have the immersive map styling
  // We'll keep track of actual map pages for specific behaviors
  const isActualMapPage = [
    '/fullscreen-map', 
    '/map-collaboration-demo', 
    '/enhanced-map-collaboration',
    '/collaborative-map',
    '/map-viewer',
    '/mapbox-demo',
    '/esri-map'
  ].includes(location);
  
  // All pages should use the immersive map styling
  const isImmersiveMapPage = true;

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
      path: '/data-quality-dashboard', 
      icon: <BarChart className="h-4 w-4" />, 
      label: 'Data Quality',
    },
    { 
      path: '/compliance-dashboard', 
      icon: <CheckCircle className="h-4 w-4" />, 
      label: 'RCW Compliance',
    },
    {
      path: '/agent-master-prompt-demo',
      icon: <MessagesSquare className="h-4 w-4" />,
      label: 'Master Prompt',
    },
    { 
      path: '/esri-map', 
      icon: <Globe className="h-4 w-4" />, 
      label: 'Esri Map',
    },
    { 
      path: '/parcel-comparison', 
      icon: <Map className="h-4 w-4" />, 
      label: 'Parcel Comparison',
    },
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
          isImmersiveMapPage 
            ? 'bg-background/70 glass-panel backdrop-blur-md border-b border-primary/10' 
            : 'bg-primary/95 backdrop-blur-sm text-primary-foreground'
        }`}
        style={{
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center p-2 rounded-full 
                ${isImmersiveMapPage ? 
                  'bg-gradient-to-br from-primary/20 to-primary/40 text-primary shadow-sm border border-primary/10' : 
                  'bg-primary-foreground/20 text-primary-foreground'}`}
                style={{
                  transform: 'translateZ(0)',
                  boxShadow: isImmersiveMapPage ? '0 2px 8px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15)' : 'none'
                }}
              >
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h1 className={`font-bold text-xl ${isImmersiveMapPage ? 'readable-text' : ''}`}
                   style={{
                     textShadow: isImmersiveMapPage ? '0 1px 1px rgba(0,0,0,0.1)' : 'none'
                   }}
                >
                  BentonGeoPro
                </h1>
                {!headerCollapsed && (
                  <p className={`text-xs ${isImmersiveMapPage ? 
                    'text-primary-700/80 font-medium' : 
                    'text-primary-foreground/80'}`}>
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
            <nav className="hidden lg:flex items-center space-x-1.5">
              {featuredLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <Button 
                    variant={location === link.path ? "default" : isImmersiveMapPage ? "ghost" : "outline"} 
                    size="sm"
                    className={`
                      ${isImmersiveMapPage ? 'btn-3d transition-all duration-300' : ''}
                      ${location === link.path && isImmersiveMapPage ? 
                        'bg-primary/90 text-primary-foreground shadow-md border border-primary/20' : 
                        isImmersiveMapPage ? 
                          'bg-background/60 backdrop-blur-sm border border-primary/5 shadow-sm hover:bg-background/80 hover:border-primary/20' : 
                          ''
                      }
                    `}
                    style={{
                      transform: location === link.path && isImmersiveMapPage ? 'translateY(-1px)' : 'none',
                      boxShadow: location === link.path && isImmersiveMapPage ? '0 4px 8px rgba(0,0,0,0.05)' : ''
                    }}
                  >
                    <div className={`
                      ${location === link.path && isImmersiveMapPage ? 
                        'bg-primary-foreground/30 p-0.5 rounded-full mr-1.5' : 
                        'mr-1.5'
                      }
                    `}>
                      {link.icon}
                    </div>
                    <span>{link.label}</span>
                  </Button>
                </Link>
              ))}
              
              {/* Header collapse toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                className={`ml-2 ${isImmersiveMapPage ? 
                  'btn-3d bg-background/60 backdrop-blur-sm border border-primary/5 shadow-sm hover:bg-background/80 hover:border-primary/20 transition-all duration-300' : 
                  ''
                }`}
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
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        location === link.path 
                          ? isImmersiveMapPage 
                            ? 'bg-background/80 backdrop-blur-md shadow-lg border border-primary/20' 
                            : 'bg-primary-foreground/20' 
                          : isImmersiveMapPage 
                            ? 'bg-background/40 backdrop-blur-sm border border-primary/5 hover:bg-background/60 hover:border-primary/20 hover:shadow-md' 
                            : 'hover:bg-primary-foreground/10'
                      }`}
                      style={{
                        transform: location === link.path && isImmersiveMapPage ? 'translateY(-2px)' : 'none',
                        boxShadow: location === link.path && isImmersiveMapPage ? '0 8px 16px rgba(0,0,0,0.08)' : ''
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          isImmersiveMapPage 
                            ? location === link.path
                              ? 'bg-primary/20 text-primary shadow-sm'
                              : 'bg-background/70 text-primary-700' 
                            : 'bg-primary-foreground/20'
                        }`}
                        style={{
                          boxShadow: isImmersiveMapPage && location === link.path 
                            ? 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.05)' 
                            : 'none'
                        }}
                        >
                          {link.icon}
                        </div>
                        <div>
                          <h3 className={`font-medium ${
                            isImmersiveMapPage && location === link.path ? 'text-primary' : ''
                          }`}
                          style={{
                            textShadow: isImmersiveMapPage ? '0 1px 1px rgba(0,0,0,0.05)' : 'none'
                          }}
                          >{link.label}</h3>
                          <p className={`text-xs ${
                            isImmersiveMapPage 
                              ? location === link.path 
                                ? 'text-primary-700/90' 
                                : 'text-gray-700/80' 
                              : 'text-primary-foreground/70'
                          }`}>
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-1.5">
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
                            className={`
                              ${location === link.path && isImmersiveMapPage ? 
                                'bg-primary/90 text-primary-foreground shadow-md border border-primary/20' : 
                                isImmersiveMapPage ? 
                                  'bg-background/60 backdrop-blur-sm border border-primary/5 shadow-sm hover:bg-background/80 hover:border-primary/20' : 
                                  ''
                              }
                              transition-all duration-300
                            `}
                            style={{
                              transform: location === link.path && isImmersiveMapPage ? 'translateY(-1px)' : 'none',
                              boxShadow: location === link.path && isImmersiveMapPage ? '0 4px 8px rgba(0,0,0,0.05)' : ''
                            }}
                          >
                            <div className={`
                              ${location === link.path && isImmersiveMapPage ? 
                                'bg-primary-foreground/30 p-0.5 rounded-full mr-1.5' : 
                                'mr-1.5'
                              }
                            `}>
                              {link.icon}
                            </div>
                            <span>{link.label}</span>
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className={isImmersiveMapPage ? 
                          "bg-background/80 backdrop-blur-sm border border-primary/10 shadow-md text-sm" : 
                          "text-sm"
                        }
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
            <div className={`py-3 lg:hidden ${isImmersiveMapPage ? 'mt-1 rounded-lg bg-background/80 backdrop-blur-md border border-primary/10 shadow-lg' : ''}`}>
              <div className="space-y-2">
                {featuredLinks.map((link) => (
                  <Link key={link.path} href={link.path}>
                    <Button 
                      variant={location === link.path ? "default" : isImmersiveMapPage ? "ghost" : "outline"} 
                      size="sm"
                      className={`
                        w-full justify-start
                        ${location === link.path && isImmersiveMapPage ? 
                          'bg-primary/90 text-primary-foreground shadow-sm border border-primary/20' : 
                          isImmersiveMapPage ? 
                            'bg-background/60 backdrop-blur-sm border border-primary/5 hover:bg-background/80 hover:border-primary/10' : 
                            ''
                        }
                        transition-all duration-200
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className={`
                        ${location === link.path && isImmersiveMapPage ? 
                          'bg-primary-foreground/30 p-0.5 rounded-full mr-1.5' : 
                          'mr-1.5'
                        }
                      `}>
                        {link.icon}
                      </div>
                      <span>{link.label}</span>
                    </Button>
                  </Link>
                ))}
                
                <div className={`border-t my-2 pt-2 ${isImmersiveMapPage ? 'border-primary/10' : 'border-primary-foreground/10'}`}>
                  {additionalLinks.map((link) => (
                    <Link key={link.path} href={link.path}>
                      <Button 
                        variant={location === link.path ? "default" : isImmersiveMapPage ? "ghost" : "outline"} 
                        size="sm"
                        className={`
                          w-full justify-start mt-1
                          ${location === link.path && isImmersiveMapPage ? 
                            'bg-primary/90 text-primary-foreground shadow-sm border border-primary/20' : 
                            isImmersiveMapPage ? 
                              'bg-background/60 backdrop-blur-sm border border-primary/5 hover:bg-background/80 hover:border-primary/10' : 
                              ''
                          }
                          transition-all duration-200
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={`
                          ${location === link.path && isImmersiveMapPage ? 
                            'bg-primary-foreground/30 p-0.5 rounded-full mr-1.5' : 
                            'mr-1.5'
                          }
                        `}>
                          {link.icon}
                        </div>
                        <span>{link.label}</span>
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
          isActualMapPage 
            ? 'pt-14 h-screen' // Only top padding for actual map pages
            : 'container mx-auto p-4 pt-24 glass-panel backdrop-blur-md bg-background/40 rounded-lg border border-primary/10 shadow-lg my-4' // Enhanced glass-morphism for regular pages
        }`}
        style={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
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
            <Route path="/parcel-comparison" component={ParcelComparisonDemo} />
            <Route path="/esri-map" component={EsriMapPage} />
            <Route path="/data-quality-dashboard" component={DataQualityDashboardPage} />
            <Route path="/compliance-dashboard" component={ComplianceDashboardPage} />
            <Route path="/agent-master-prompt-demo" component={AgentMasterPromptDemo} />
            
            {/* Default to the fullscreen map page */}
            <Route>
              <FullScreenMapPage />
            </Route>
          </Switch>
        </ErrorBoundary>
      </main>
      
      {/* Footer - Now with glass-morphism styling for all pages */}
      {!isActualMapPage && (
        <footer className="glass-panel backdrop-blur-md bg-background/40 border-t border-primary/10 p-4 text-center text-sm mt-auto">
          <div className="container mx-auto">
            <p className="readable-text font-medium">BentonGeoPro &copy; 2025 - GIS Workflow Solution</p>
            <p className="text-xs mt-1 text-primary/70">Simplified Development Mode</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
