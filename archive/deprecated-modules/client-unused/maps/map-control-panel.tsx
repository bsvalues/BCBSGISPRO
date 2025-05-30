import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface MapControlPanelProps {
  /**
   * Panel title
   */
  title: string;
  
  /**
   * Panel content
   */
  children: ReactNode;
  
  /**
   * Panel position on the map
   * @default 'top-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Whether the panel is collapsible
   * @default true
   */
  collapsible?: boolean;
  
  /**
   * Whether the panel is collapsed by default
   * @default false
   */
  defaultCollapsed?: boolean;
  
  /**
   * Whether the panel is dismissible
   * @default false
   */
  dismissible?: boolean;
  
  /**
   * Callback when panel is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Position offset from the edge (in pixels)
   * @default 16
   */
  offset?: number;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * A floating control panel for map interactions that can be positioned
 * at various locations on the map. It can be collapsible and/or dismissible.
 */
export function MapControlPanel({
  title,
  children,
  position = 'top-right',
  collapsible = true,
  defaultCollapsed = false,
  dismissible = false,
  onDismiss,
  offset = 16,
  className,
}: MapControlPanelProps) {
  // State for collapsed status
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // State for dismissed status
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Position-specific classes
  const positionClasses = {
    'top-left': `top-${offset}px left-${offset}px`,
    'top-right': `top-${offset}px right-${offset}px`,
    'bottom-left': `bottom-${offset}px left-${offset}px`,
    'bottom-right': `bottom-${offset}px right-${offset}px`,
  };
  
  // Handle collapse toggle
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // If dismissed, don't render anything
  if (isDismissed) {
    return null;
  }
  
  return (
    <Card
      className={cn(
        'absolute z-10 w-72 max-w-[calc(100%-32px)] glass-panel',
        'transition-all duration-300 ease-in-out transform',
        isCollapsed ? 'opacity-80 hover:opacity-100' : 'opacity-100',
        positionClasses[position],
        className
      )}
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)'
      }}
    >
      {/* Panel header with title and controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/20 bg-white/10 backdrop-blur-md">
        <h3 className="text-sm font-medium truncate readable-text">{title}</h3>
        
        <div className="flex items-center space-x-1">
          {/* Collapse button */}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="h-6 w-6 p-0 hover:bg-white/20 btn-3d"
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Dismiss button */}
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-white/20 hover:text-red-500 btn-3d"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Panel content (hidden when collapsed) */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isCollapsed ? 'max-h-0' : 'max-h-[70vh]'
        )}
      >
        <CardContent className="overflow-y-auto p-3">
          <div className="readable-text">
            {children}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}