import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Layers,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Settings,
  Info
} from "lucide-react";
import { MapLayer } from '@/lib/map-utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedLayerControlProps {
  mapLayers: MapLayer[];
  onLayerChange: (layers: MapLayer[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EnhancedLayerControl({ 
  mapLayers, 
  onLayerChange,
  open = false,
  onOpenChange
}: EnhancedLayerControlProps) {
  const map = useMap();
  const [layers, setLayers] = useState<MapLayer[]>(mapLayers);
  const [localOpen, setLocalOpen] = useState(open);
  
  // Synchronize layers when props change
  useEffect(() => {
    setLayers(mapLayers);
  }, [mapLayers]);
  
  // Sync open state with props
  useEffect(() => {
    setLocalOpen(open);
  }, [open]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setLocalOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  const handleLayerToggle = (id: number, visible: boolean) => {
    const updatedLayers = layers.map(layer => 
      layer.id === id ? { ...layer, visible } : layer
    );
    
    setLayers(updatedLayers);
    onLayerChange(updatedLayers);
  };
  
  const handleLayerOpacity = (id: number, opacity: number) => {
    const updatedLayers = layers.map(layer => 
      layer.id === id ? { ...layer, opacity } : layer
    );
    
    setLayers(updatedLayers);
    onLayerChange(updatedLayers);
  };
  
  const handleMoveLayer = (id: number, direction: 'up' | 'down') => {
    const index = layers.findIndex(layer => layer.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === layers.length - 1)
    ) {
      return; // Can't move further
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(index, 1);
    newLayers.splice(newIndex, 0, movedLayer);
    
    setLayers(newLayers);
    onLayerChange(newLayers);
  };

  return (
    <Sheet open={localOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[350px] sm:w-[450px] p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center">
            <Layers className="h-5 w-5 mr-2" /> 
            Map Layers
          </SheetTitle>
          <SheetDescription>
            Manage map layers, visibility, and ordering
          </SheetDescription>
        </SheetHeader>
        
        <div className="px-6 py-2">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-neutral-500">
              {layers.filter(l => l.visible).length} of {layers.length} layers visible
            </p>
            
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allVisible = layers.map(l => ({ ...l, visible: true }));
                        setLayers(allVisible);
                        onLayerChange(allVisible);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Show All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show all layers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allHidden = layers.map(l => ({ ...l, visible: false }));
                        setLayers(allHidden);
                        onLayerChange(allHidden);
                      }}
                    >
                      <EyeOff className="h-4 w-4 mr-1" /> Hide All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hide all layers</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <Accordion type="multiple" className="w-full">
            {layers.map((layer, index) => (
              <AccordionItem value={`layer-${layer.id}`} key={layer.id} className="border px-4">
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center">
                    <Switch 
                      id={`layer-toggle-${layer.id}`}
                      checked={layer.visible}
                      onCheckedChange={(checked) => handleLayerToggle(layer.id, checked)}
                      className="mr-3"
                    />
                    <Label 
                      htmlFor={`layer-toggle-${layer.id}`}
                      className={`font-medium ${!layer.visible ? 'text-neutral-400' : ''}`}
                    >
                      {layer.name}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => handleMoveLayer(layer.id, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move up</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            disabled={index === layers.length - 1}
                            onClick={() => handleMoveLayer(layer.id, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Move down</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <AccordionTrigger className="h-7 w-7 [&[data-state=open]>svg]:rotate-180">
                      <Settings className="h-4 w-4" />
                    </AccordionTrigger>
                  </div>
                </div>
                
                <AccordionContent>
                  <div className="pb-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`layer-opacity-${layer.id}`} className="text-sm">
                          Opacity: {((layer.opacity || 1) * 100).toFixed(0)}%
                        </Label>
                      </div>
                      <Slider
                        id={`layer-opacity-${layer.id}`}
                        defaultValue={[layer.opacity || 1]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => handleLayerOpacity(layer.id, value)}
                      />
                    </div>
                    
                    <div className="flex items-start space-x-2 text-sm text-neutral-600">
                      <Info className="h-4 w-4 mt-0.5 text-neutral-400" />
                      <div>
                        <p className="font-medium">Layer Info</p>
                        <p>Type: {layer.type}</p>
                        <p>Source: {layer.source}</p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}