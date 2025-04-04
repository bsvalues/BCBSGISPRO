import { useState, useRef, useEffect } from 'react';
import mapboxgl, { Map, Marker, Popup } from 'mapbox-gl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { v4 as uuidv4 } from 'uuid';
import { 
  MapPin, Type, Image, Ruler, Plus, Edit, Trash2, 
  CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { 
  useCollaborativeAnnotations, 
  AnnotationType,
  Annotation,
  ConnectionStatus
} from '@/hooks/use-collaborative-annotations';

interface CollaborativeAnnotationsProps {
  map: Map | null;
  roomId?: string;
}

// Helper to get a user color from a userId string
function getUserColor(userId: string): string {
  // Generate a color based on the hash of the user ID
  const hash = Array.from(userId).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const h = Math.abs(hash) % 360; // Hue (0-360)
  const s = 70 + (Math.abs(hash) % 20); // Saturation (70-90%)
  const l = 40 + (Math.abs(hash) % 10); // Lightness (40-50%)
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function CollaborativeAnnotations({ map, roomId = 'default' }: CollaborativeAnnotationsProps) {
  // Get annotations from the hook
  const { 
    annotations, 
    createAnnotation, 
    updateAnnotation, 
    deleteAnnotation,
    connectionStatus
  } = useCollaborativeAnnotations(roomId);

  // Active annotation to edit
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  
  // Annotation creation mode
  const [createMode, setCreateMode] = useState<AnnotationType | null>(null);
  
  // Text for a new annotation
  const [newAnnotationText, setNewAnnotationText] = useState('');
  
  // Reference to map markers and popups
  const markersRef = useRef<{ [id: string]: Marker }>({});
  const popupsRef = useRef<{ [id: string]: Popup }>({});
  
  // Add mode click handler
  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!createMode || !map) return;
    
    // Create annotation at clicked location
    const newAnnotation = createAnnotation({
      type: createMode,
      position: {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      },
      content: newAnnotationText || `New ${createMode} annotation`
    });
    
    // Reset create mode
    setCreateMode(null);
    setNewAnnotationText('');
    
    // Set as active for editing
    setActiveAnnotation(newAnnotation);
  };
  
  // Set up click listener when in create mode
  useEffect(() => {
    if (!map) return;
    
    if (createMode) {
      // Change cursor to indicate clickable state
      map.getCanvas().style.cursor = 'crosshair';
      
      // Add click listener
      map.once('click', handleMapClick);
      
      return () => {
        map.off('click', handleMapClick);
        map.getCanvas().style.cursor = '';
      };
    } else {
      map.getCanvas().style.cursor = '';
    }
  }, [createMode, map, newAnnotationText]);
  
  // Handle deleting an annotation
  const handleDeleteAnnotation = (id: string) => {
    deleteAnnotation(id);
    setActiveAnnotation(null);
    
    // Remove marker and popup
    if (markersRef.current[id]) {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    }
    
    if (popupsRef.current[id]) {
      popupsRef.current[id].remove();
      delete popupsRef.current[id];
    }
  };
  
  // Save changes to an annotation
  const handleSaveChanges = () => {
    if (!activeAnnotation) return;
    
    updateAnnotation(activeAnnotation.id, {
      content: activeAnnotation.content
    });
    
    setActiveAnnotation(null);
  };
  
  // Render markers for annotations
  useEffect(() => {
    if (!map) return;
    
    // Clean up old markers and popups
    Object.values(markersRef.current).forEach(marker => marker.remove());
    Object.values(popupsRef.current).forEach(popup => popup.remove());
    
    // Reset refs
    markersRef.current = {};
    popupsRef.current = {};
    
    // Create new markers for each annotation
    annotations.forEach(annotation => {
      // Create marker element
      const el = document.createElement('div');
      
      // Style based on annotation type
      const color = getUserColor(annotation.createdBy);
      
      // Apply styles based on type
      el.className = 'annotation-marker';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.border = `2px solid ${color}`;
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      
      // Add icon based on type
      if (annotation.type === AnnotationType.TEXT) {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`;
      } else if (annotation.type === AnnotationType.MARKER) {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      } else if (annotation.type === AnnotationType.IMAGE) {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
      } else if (annotation.type === AnnotationType.MEASUREMENT) {
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"></path><path d="M6 8l-4 4 4 4"></path><path d="M18 8l4 4-4 4"></path></svg>`;
      }
      
      // Create popup for this annotation
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px',
        offset: 25
      }).setHTML(`
        <div style="max-width: 250px;">
          <div style="font-weight: bold; display: flex; align-items: center; margin-bottom: 5px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; background-color: ${color};"></span>
            ${annotation.createdBy.substring(0, 8)}
          </div>
          <div style="white-space: pre-wrap;">${annotation.content}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 5px;">
            ${new Date(annotation.createdAt).toLocaleString()}
          </div>
        </div>
      `);
      
      // Create the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([annotation.position.lng, annotation.position.lat])
        .setPopup(popup)
        .addTo(map);
      
      // Show popup on hover
      el.addEventListener('mouseenter', () => {
        popup.addTo(map);
      });
      
      // Hide popup on mouse leave
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });
      
      // Handle click to edit
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setActiveAnnotation(annotation);
      });
      
      // Store references
      markersRef.current[annotation.id] = marker;
      popupsRef.current[annotation.id] = popup;
    });
    
    // Cleanup function
    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      Object.values(popupsRef.current).forEach(popup => popup.remove());
    };
  }, [map, annotations]);
  
  // Connection status indicator
  const connectionStatusColor = 
    connectionStatus === ConnectionStatus.CONNECTED ? 'text-green-500' :
    connectionStatus === ConnectionStatus.CONNECTING ? 'text-amber-500' :
    connectionStatus === ConnectionStatus.RECONNECTING ? 'text-amber-500' :
    'text-red-500';
  
  const connectionStatusText = 
    connectionStatus === ConnectionStatus.CONNECTED ? 'Connected' :
    connectionStatus === ConnectionStatus.CONNECTING ? 'Connecting...' :
    connectionStatus === ConnectionStatus.RECONNECTING ? 'Reconnecting...' :
    'Disconnected';
  
  const connectionStatusIcon = 
    connectionStatus === ConnectionStatus.CONNECTED ? <CheckCircle className="h-3 w-3" /> :
    connectionStatus === ConnectionStatus.CONNECTING ? <Info className="h-3 w-3" /> :
    connectionStatus === ConnectionStatus.RECONNECTING ? <Info className="h-3 w-3" /> :
    <AlertCircle className="h-3 w-3" />;
  
  return (
    <Card className="w-auto">
      <CardContent className="p-3">
        {/* Connection status */}
        <div className="mb-2 flex justify-end">
          <Badge variant="outline" className={`${connectionStatusColor} text-xs`}>
            {connectionStatusIcon}
            <span className="ml-1">{connectionStatusText}</span>
          </Badge>
        </div>
        
        {/* Annotation controls */}
        <div className="flex flex-col gap-2">
          {/* Active annotation edit form */}
          {activeAnnotation ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Edit Annotation</div>
              
              <Textarea 
                value={activeAnnotation.content}
                onChange={(e) => setActiveAnnotation({
                  ...activeAnnotation,
                  content: e.target.value
                })}
                placeholder="Annotation text"
                className="min-h-[100px]"
              />
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteAnnotation(activeAnnotation.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveAnnotation(null)}
                >
                  Cancel
                </Button>
                
                <Button 
                  size="sm"
                  onClick={handleSaveChanges}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Create mode form */}
              {createMode && (
                <div className="space-y-2 mb-2">
                  <div className="text-sm font-medium">
                    New {createMode.charAt(0).toUpperCase() + createMode.slice(1)} Annotation
                  </div>
                  
                  <Textarea 
                    value={newAnnotationText}
                    onChange={(e) => setNewAnnotationText(e.target.value)}
                    placeholder={`Enter ${createMode} annotation text...`}
                    className="min-h-[80px]"
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    Click on the map to place annotation
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCreateMode(null)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              {/* Add annotation buttons */}
              {!createMode && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Add Annotation</div>
                  
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCreateMode(AnnotationType.TEXT)}
                          >
                            <Type className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Text Note</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCreateMode(AnnotationType.MARKER)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Marker</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCreateMode(AnnotationType.IMAGE)}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Image Reference</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCreateMode(AnnotationType.MEASUREMENT)}
                          >
                            <Ruler className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Measurement</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}