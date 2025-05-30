import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  SimpleTooltip 
} from '@/components/ui/tooltip';
import { MapTool } from '@/lib/map-utils';

interface ControlItem {
  /**
   * Unique identifier for the control
   */
  id: string;
  
  /**
   * Label for the control
   */
  label: string;
  
  /**
   * Icon element for the control
   */
  icon: React.ReactNode;
  
  /**
   * Whether the control is active
   */
  isActive?: boolean;
  
  /**
   * Whether the control is disabled
   */
  isDisabled?: boolean;
  
  /**
   * Click handler for the control
   */
  onClick?: () => void;
  
  /**
   * Optional keyboard shortcut
   */
  shortcut?: string;
  
  /**
   * Optional badge content (like numbers or status indicators)
   */
  badge?: React.ReactNode;
}

interface ControlGroup {
  /**
   * Unique identifier for the group
   */
  id: string;
  
  /**
   * Group label (for accessibility)
   */
  label: string;
  
  /**
   * Controls in this group
   */
  controls: ControlItem[];
  
  /**
   * Whether the group is collapsible
   */
  collapsible?: boolean;
  
  /**
   * Whether the group is collapsed by default
   */
  defaultCollapsed?: boolean;
}

interface SleekMapControlsProps {
  /**
   * Current active tool
   */
  activeTool?: MapTool;
  
  /**
   * Callback when a tool is selected
   */
  onToolChange?: (tool: MapTool) => void;
  
  /**
   * Control groups to display
   */
  controlGroups?: ControlGroup[];
  
  /**
   * Position of the controls on the map
   * @default 'top-left'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Layout direction
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  
  /**
   * Whether to auto-hide controls after inactivity
   */
  autoHide?: boolean;
  
  /**
   * Time in ms before controls auto-hide
   */
  autoHideDelay?: number;
  
  /**
   * Visual style variant
   */
  variant?: 'minimal' | 'standard' | 'premium';
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Ultra-modern map controls with cinematic visual styling, motion effects,
 * and intuitive interaction patterns. Provides a professional, award-worthy
 * interface for map interaction.
 */
export function SleekMapControls({
  activeTool,
  onToolChange,
  controlGroups = [],
  position = 'top-left',
  direction = 'horizontal',
  autoHide = false,
  autoHideDelay = 3000,
  variant = 'premium',
  className,
}: SleekMapControlsProps) {
  // State for visibility when using auto-hide
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [groupStates, setGroupStates] = useState<{[key: string]: boolean}>({});
  
  // Initialize collapsed states for groups
  useEffect(() => {
    const initialStates: {[key: string]: boolean} = {};
    controlGroups.forEach(group => {
      if (group.collapsible) {
        initialStates[group.id] = group.defaultCollapsed || false;
      }
    });
    setGroupStates(initialStates);
  }, [controlGroups]);
  
  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide || isHovering) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);
    
    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay, isHovering]);
  
  // Reset visibility on mouse movement
  useEffect(() => {
    if (!autoHide || isHovering) return;
    
    const handleMouseMove = () => {
      setIsVisible(true);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [autoHide, isHovering]);
  
  // Toggle group collapsed state
  const toggleGroup = (groupId: string) => {
    setGroupStates(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Position-specific classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  // Direction-specific classes
  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col',
  };
  
  // Style variants
  const variantClasses = {
    minimal: 'bg-black/20 backdrop-blur-sm',
    standard: 'glass-panel',
    premium: 'premium-glass'
  };
  
  // Visibility transition classes
  const visibilityClasses = cn(
    'transition-all duration-300 ease-in-out transform',
    !isVisible && (
      position.includes('left') 
        ? '-translate-x-2 opacity-0' 
        : 'translate-x-2 opacity-0'
    )
  );
  
  return (
    <div
      className={cn(
        'absolute z-20',
        positionClasses[position],
        visibilityClasses,
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={cn(
        'flex gap-2.5',
        directionClasses[direction]
      )}>
        {controlGroups.map((group) => {
          const isCollapsed = group.collapsible && groupStates[group.id];
          
          return (
            <div
              key={group.id}
              className={cn(
                'flex',
                direction === 'horizontal' ? 'flex-row' : 'flex-col',
                'gap-1.5',
                'rounded-xl overflow-hidden',
                variantClasses[variant]
              )}
              aria-label={group.label}
              style={{
                transform: 'translateZ(10px)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              {/* Group controls */}
              <div className={cn(
                'flex p-2',
                direction === 'horizontal' ? 'flex-row' : 'flex-col',
                'gap-2',
                // Animate height/width when collapsing
                'transition-all duration-300 ease-in-out',
                isCollapsed && 'overflow-hidden',
                isCollapsed && (direction === 'horizontal' ? 'w-0 p-0' : 'h-0 p-0')
              )}>
                {group.controls.map((control) => (
                  <SimpleTooltip
                    key={control.id}
                    content={
                      <div className="tooltip-3d px-3 py-1.5 rounded-md">
                        <div className="flex items-center gap-2">
                          <span>{control.label}</span>
                          {control.shortcut && (
                            <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded">
                              {control.shortcut}
                            </span>
                          )}
                        </div>
                      </div>
                    }
                    side={direction === 'horizontal' ? 'bottom' : 'right'}
                  >
                    <div className="relative">
                      <Button
                        variant={control.isActive ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-10 w-10 rounded-lg btn-3d',
                          control.isActive 
                            ? 'bg-primary/15 text-primary-900 shadow-lg' 
                            : 'bg-white/10 hover:bg-white/20 text-gray-800',
                          control.isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                        style={{
                          backdropFilter: 'blur(8px)',
                          boxShadow: control.isActive 
                            ? '0 8px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)' 
                            : undefined,
                          transform: control.isActive ? 'translateZ(5px)' : 'translateZ(2px)'
                        }}
                        onClick={control.onClick}
                        disabled={control.isDisabled}
                        aria-label={control.label}
                        aria-pressed={control.isActive}
                      >
                        {control.icon}
                      </Button>
                      
                      {/* Badge indicator (optional) */}
                      {control.badge && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-md">
                          {control.badge}
                        </div>
                      )}
                    </div>
                  </SimpleTooltip>
                ))}
              </div>
              
              {/* Collapsible toggle for group (if enabled) */}
              {group.collapsible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'p-0 m-0 h-full min-w-[12px] flex items-center justify-center bg-white/5',
                    direction === 'horizontal' ? 'w-6' : 'h-6',
                    'hover:bg-primary/10'
                  )}
                  aria-label={isCollapsed ? `Expand ${group.label}` : `Collapse ${group.label}`}
                >
                  <div className={cn(
                    'text-gray-600 opacity-70 transition-transform',
                    direction === 'horizontal' 
                      ? (isCollapsed ? 'rotate-0' : 'rotate-180')
                      : (isCollapsed ? 'rotate-90' : '-rotate-90')
                  )}>
                    {/* Compact chevron icon */}
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Reveal button that appears when controls are hidden */}
      {!isVisible && (
        <button
          className={cn(
            'absolute w-10 h-10 flex items-center justify-center',
            'rounded-full bg-white/50 backdrop-blur-md',
            'shadow-lg cursor-pointer transition-all btn-3d',
            position.includes('left') ? 'left-2' : 'right-2',
            position.includes('top') ? 'top-2' : 'bottom-2'
          )}
          onClick={() => setIsVisible(true)}
          aria-label="Show map controls"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}