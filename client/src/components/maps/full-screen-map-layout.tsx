import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUp, 
  X, 
  Maximize, 
  Minimize, 
  Settings 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullScreenMapLayoutProps {
  /**
   * The main content (map) to display
   */
  children: ReactNode;
  
  /**
   * Header content to display above the map
   */
  headerContent?: ReactNode;
  
  /**
   * Sidebar content to display alongside the map
   */
  sidebarContent?: ReactNode;
  
  /**
   * Footer content to display below the map
   */
  footerContent?: ReactNode;
  
  /**
   * Whether the sidebar is collapsed by default
   */
  defaultCollapsed?: boolean;
  
  /**
   * Sidebar width in pixels when expanded
   */
  sidebarWidth?: number;
}

/**
 * A modern immersive layout component with true full-screen experience
 * - Smart UI that reveals/hides based on user interaction
 * - Maximized map viewing area with floating controls
 * - Responsive design for all screen sizes
 * - Professional 3D visual styling
 */
export function FullScreenMapLayout({
  children,
  headerContent,
  sidebarContent,
  footerContent,
  defaultCollapsed = true,
  sidebarWidth = 360,
}: FullScreenMapLayoutProps) {
  // Core state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);
  const [sidebarFullyExpanded, setSidebarFullyExpanded] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [userActive, setUserActive] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Detect mobile devices and adjust layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarCollapsed]);
  
  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    setUserActive(true);
    
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }
    
    // Hide controls after 4 seconds of inactivity
    controlsTimeout.current = setTimeout(() => {
      if (userActive) setControlsVisible(false);
    }, 4000);
    
    // Consider user inactive after 10 seconds
    inactivityTimeout.current = setTimeout(() => {
      setUserActive(false);
    }, 10000);
  }, [userActive]);
  
  // Set up mouse movement listener for controls visibility
  useEffect(() => {
    const handleActivity = () => resetControlsTimer();
    
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity);
    
    resetControlsTimer();
    
    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
    };
  }, [resetControlsTimer]);
  
  // Calculate sidebar styling based on state
  const effectiveSidebarWidth = sidebarCollapsed 
    ? 0 
    : sidebarFullyExpanded
      ? isMobile ? '100%' : '50%'
      : sidebarWidth;
  
  const sidebarStyle = {
    width: typeof effectiveSidebarWidth === 'number' 
      ? `${effectiveSidebarWidth}px` 
      : effectiveSidebarWidth,
    right: sidebarFullyExpanded ? '0' : undefined,
  };
  
  // Animation classes for transitions
  const transitionClass = "transition-all duration-300 ease-in-out transform";
  const fadeInClass = "animate-in fade-in duration-300";
  const fadeOutClass = "animate-out fade-out duration-300";
  const slideInLeftClass = "animate-in slide-in-from-left duration-300";
  const slideOutLeftClass = "animate-out slide-out-to-left duration-300";
  
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative">
      {/* Full-screen map container - Always fills entire viewport */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {children}
      </div>
      
      {/* Control overlay - Appears/disappears based on user activity */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none z-10",
          transitionClass,
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Header toggle button - Top center */}
        <div 
          className={cn(
            "absolute top-3 left-1/2 transform -translate-x-1/2 pointer-events-auto z-30",
            transitionClass,
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHeaderVisible(!headerVisible)}
            className="h-9 w-9 p-0 rounded-full glass-panel btn-3d"
            aria-label={headerVisible ? "Hide navigation" : "Show navigation"}
          >
            {headerVisible ? (
              <X className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Sidebar toggle buttons - Left edge */}
        {sidebarContent && (
          <div 
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 left-3 space-y-3 pointer-events-auto z-30",
              transitionClass,
              controlsVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            )}
          >
            {/* Main sidebar toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSidebarCollapsed(!sidebarCollapsed);
                if (sidebarFullyExpanded) setSidebarFullyExpanded(false);
              }}
              className="h-12 w-12 p-0 rounded-full glass-panel btn-3d flex items-center justify-center"
              aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-6 w-6" />
              ) : (
                <ChevronLeft className="h-6 w-6" />
              )}
            </Button>
            
            {/* Sidebar expand/collapse button - only shown when sidebar is open */}
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarFullyExpanded(!sidebarFullyExpanded)}
                className="h-9 w-9 p-0 rounded-full glass-panel btn-3d flex items-center justify-center"
                aria-label={sidebarFullyExpanded ? "Minimize sidebar" : "Maximize sidebar"}
              >
                {sidebarFullyExpanded ? (
                  <ChevronsLeft className="h-4 w-4" />
                ) : (
                  <ChevronsRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Footer toggle button - Bottom right */}
        <div 
          className={cn(
            "absolute bottom-3 right-3 pointer-events-auto z-30",
            transitionClass,
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFooterVisible(!footerVisible)}
            className="h-9 w-9 p-0 rounded-full glass-panel btn-3d"
            aria-label={footerVisible ? "Hide info" : "Show info"}
          >
            {footerVisible ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Header content - slides down when visible */}
      {headerContent && (
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 pointer-events-auto z-30 glass-panel backdrop-blur-md border-b border-white/20",
            transitionClass,
            headerVisible 
              ? "translate-y-0 opacity-100" 
              : "-translate-y-full opacity-0"
          )}
          style={{
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
          }}
        >
          {headerContent}
        </div>
      )}
      
      {/* Sidebar panel - slides in from the left with professional appearance */}
      {sidebarContent && (
        <div 
          className={cn(
            "absolute z-20 pointer-events-auto glass-panel",
            "overflow-hidden border border-white/20",
            transitionClass,
            sidebarFullyExpanded 
              ? "inset-y-0 right-0 rounded-l-lg border-r-0" 
              : isMobile
                ? "inset-y-0 left-0 rounded-r-lg border-l-0"
                : "top-16 bottom-16 left-12 rounded-lg",
            !sidebarCollapsed 
              ? "opacity-100" 
              : "opacity-0 pointer-events-none"
          )}
          style={{
            ...sidebarStyle,
            transform: sidebarCollapsed 
              ? sidebarFullyExpanded && !isMobile
                ? 'translateX(100%)' 
                : 'translateX(-100%)'
              : 'translateX(0)',
            backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 100%)',
            boxShadow: sidebarFullyExpanded 
              ? '-10px 0 30px rgba(0, 0, 0, 0.1)' 
              : '10px 0 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="h-full flex flex-col overflow-hidden relative">
            {/* Close button for mobile view */}
            {isMobile && (
              <div className="absolute top-2 right-2 z-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-8 w-8 p-0 rounded-full"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Sidebar content with elegant scrolling */}
            <div className="flex-grow overflow-y-auto readable-text px-1">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer content - slides up when visible */}
      {footerContent && (
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 pointer-events-auto z-30 glass-panel backdrop-blur-md border-t border-white/20",
            transitionClass,
            footerVisible 
              ? "translate-y-0 opacity-100" 
              : "translate-y-full opacity-0"
          )}
          style={{
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.08)'
          }}
        >
          {footerContent}
        </div>
      )}
      
      {/* Invisible overlay to detect movement and show controls */}
      {!controlsVisible && (
        <div 
          className="absolute inset-0 z-5"
          onMouseMove={resetControlsTimer}
          onClick={resetControlsTimer}
          style={{ cursor: 'none' }}
        />
      )}
    </div>
  );
}