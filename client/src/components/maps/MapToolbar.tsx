import React from 'react';
import { 
  Search, 
  MapPin, 
  Ruler, 
  Pencil, 
  Eraser, 
  PanelLeft, 
  Download, 
  Share2, 
  Grid, 
  List, 
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MapToolbarProps {
  onToolChange?: (tool: string) => void;
  onViewToggle?: (view: 'map' | 'list') => void;
  currentView?: 'map' | 'list';
  className?: string;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  onToolChange,
  onViewToggle,
  currentView = 'map',
  className
}) => {
  return (
    <div className={cn("flex items-center justify-between p-2 glass-panel backdrop-blur-md bg-background/40 border-b border-primary/10", className)}>
      {/* Left section - Search */}
      <div className="flex items-center w-80">
        <div className="relative w-full">
          <Input 
            type="text" 
            placeholder="Search parcels, addresses, or owners..." 
            className="pl-10 pr-4 h-9 bg-white/50 border-gray-200 focus-visible:ring-teal-500"
          />
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        </div>
      </div>
      
      {/* Center section - Drawing tools */}
      <div className="flex-1 flex justify-center">
        <TooltipProvider>
          <div className="glass-panel backdrop-blur-sm bg-background/30 rounded-lg border border-primary/10 p-1 flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 rounded-md"
                  onClick={() => onToolChange?.('select')}
                >
                  <MapPin size={16} className="mr-1" />
                  <span className="text-xs">Select</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select a parcel or feature</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 rounded-md"
                  onClick={() => onToolChange?.('measure')}
                >
                  <Ruler size={16} className="mr-1" />
                  <span className="text-xs">Measure</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Measure distance or area</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 rounded-md"
                  onClick={() => onToolChange?.('draw')}
                >
                  <Pencil size={16} className="mr-1" />
                  <span className="text-xs">Draw</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Draw shapes on the map</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 rounded-md"
                  onClick={() => onToolChange?.('erase')}
                >
                  <Eraser size={16} className="mr-1" />
                  <span className="text-xs">Erase</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Erase drawn elements</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      
      {/* Right section - View options */}
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-md"
                onClick={() => onToolChange?.('layers')}
              >
                <Layers size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Layers</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-md"
                onClick={() => onToolChange?.('settings')}
              >
                <SlidersHorizontal size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Map Settings</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-md"
                onClick={() => onToolChange?.('download')}
              >
                <Download size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Map</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 rounded-md"
                onClick={() => onToolChange?.('share')}
              >
                <Share2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Map</TooltipContent>
          </Tooltip>
          
          <div className="h-6 border-l border-gray-300 mx-1"></div>
          
          <ToggleGroup 
            type="single" 
            value={currentView} 
            onValueChange={(value) => value && onViewToggle?.(value as 'map' | 'list')}
            className="bg-white/50 rounded-md border border-gray-200 p-0.5"
          >
            <ToggleGroupItem value="map" className="h-8 w-8 p-0 data-[state=on]:bg-teal-100 data-[state=on]:text-teal-700">
              <Grid size={16} />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="h-8 w-8 p-0 data-[state=on]:bg-teal-100 data-[state=on]:text-teal-700">
              <List size={16} />
            </ToggleGroupItem>
          </ToggleGroup>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default MapToolbar;