import React from 'react';
import { PanelLeft, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MapLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  toolbar?: React.ReactNode; 
  className?: string;
  onLeftSidebarToggle?: () => void;
  onRightSidebarToggle?: () => void;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
}

export const MapLayout: React.FC<MapLayoutProps> = ({ 
  children, 
  sidebar,
  toolbar,
  className,
  onLeftSidebarToggle,
  onRightSidebarToggle,
  isLeftSidebarOpen = false,
  isRightSidebarOpen = false
}) => {
  return (
    <div className={cn("relative h-[calc(100vh-4rem)] w-full overflow-hidden", className)}>
      {/* Map toolbar */}
      {toolbar && (
        <div className="absolute top-0 left-0 right-0 z-10">
          {toolbar}
        </div>
      )}
      
      {/* Map container */}
      <div className="h-full w-full">{children}</div>
      
      {/* Sidebar toggle buttons */}
      {onLeftSidebarToggle && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-[50%] transform -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-primary/10 shadow-md"
          onClick={onLeftSidebarToggle}
        >
          <PanelLeft className={cn("h-4 w-4 transition-transform", isLeftSidebarOpen && "rotate-180")} />
        </Button>
      )}
      
      {onRightSidebarToggle && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-[50%] transform -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-primary/10 shadow-md"
          onClick={onRightSidebarToggle}
        >
          <PanelRight className={cn("h-4 w-4 transition-transform", isRightSidebarOpen && "rotate-180")} />
        </Button>
      )}
      
      {/* Render sidebar if provided */}
      {sidebar}
    </div>
  );
};

export default MapLayout;