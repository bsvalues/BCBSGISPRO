import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * A layout component for creating beautiful full-screen map experiences
 * with collapsible sidebar, header, and footer elements.
 */
export function FullScreenMapLayout({
  children,
  headerContent,
  sidebarContent,
  footerContent,
  defaultCollapsed = false,
  sidebarWidth = 320,
}: FullScreenMapLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);
  
  // Calculate the main content width based on sidebar state
  const mainStyle = {
    left: sidebarCollapsed ? '0' : `${sidebarWidth}px`,
    width: sidebarCollapsed ? '100%' : `calc(100% - ${sidebarWidth}px)`,
  };
  
  // Calculate the sidebar width
  const sidebarStyle = {
    width: sidebarCollapsed ? '0' : `${sidebarWidth}px`,
  };
  
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      {/* Main map container - Positioned absolutely to enable full immersion */}
      <div className="immersive-map">
        {children}
      </div>
      
      {/* Overlay elements positioned on top of the map */}
      <div className="relative w-full h-full pointer-events-none">
        {/* Header (optional) - transparent overlay */}
        {headerContent && (
          <header className="absolute top-0 left-0 right-0 pointer-events-auto z-30 glass-panel bg-opacity-60 backdrop-blur-md border-b border-white/20">
            {headerContent}
          </header>
        )}
        
        {/* Sidebar (optional) - Floating panel */}
        {sidebarContent && (
          <aside 
            className={cn(
              "absolute h-[calc(100%-2rem)] top-16 left-4 z-20 pointer-events-auto glass-panel",
              "transition-all duration-300 ease-in-out overflow-hidden",
              "border border-white/20 rounded-lg"
            )}
            style={{
              ...sidebarStyle,
              backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Sidebar content */}
              <div className="flex-grow overflow-y-auto readable-text">
                {sidebarContent}
              </div>
            </div>
          </aside>
        )}
        
        {/* Toggle button for sidebar - Styled as floating control */}
        {sidebarContent && (
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "absolute top-20 z-30 pointer-events-auto btn-3d",
              "transition-all duration-300 ease-in-out glass-panel",
              "h-8 w-8 p-0 flex items-center justify-center",
              sidebarCollapsed ? "left-4" : `left-[${sidebarWidth - 16}px]`
            )}
            style={{
              left: sidebarCollapsed ? '1rem' : `${sidebarWidth - 16}px`,
            }}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {/* Footer (optional) - transparent overlay */}
        {footerContent && (
          <footer className="absolute bottom-0 left-0 right-0 pointer-events-auto z-30 glass-panel bg-opacity-60 backdrop-blur-md border-t border-white/20">
            {footerContent}
          </footer>
        )}
      </div>
    </div>
  );
}