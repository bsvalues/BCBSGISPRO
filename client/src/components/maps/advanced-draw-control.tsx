import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { GeoJSONFeature } from '@/lib/map-utils';
import { 
  findNearestPoint, 
  canSnapToFeature,
  FeatureVersionTracker,
  createFeature,
  splitPolygon,
  joinPolygons,
  generateLegalDescription
} from '@/lib/advanced-drawing-utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Scissors,
  Combine,
  RotateCcw,
  Save,
  FileText,
  Undo2,
  Grid,
  Ruler
} from 'lucide-react';

// Event constants
const CREATED = 'draw:created';
const EDITED = 'draw:edited';
const DELETED = 'draw:deleted';
const DRAWSTART = 'draw:drawstart';
const DRAWSTOP = 'draw:drawstop';
const DRAWVERTEX = 'draw:drawvertex';
const EDITSTART = 'draw:editstart';
const EDITSTOP = 'draw:editstop';
const EDITVERTEX = 'draw:editvertex';

interface AdvancedDrawControlProps {
  position?: L.ControlPosition;
  onFeatureCreate?: (feature: GeoJSONFeature) => void;
  onFeatureEdit?: (features: GeoJSONFeature[]) => void;
  onFeatureDelete?: (features: GeoJSONFeature[]) => void;
  onVersionChange?: (featureId: string, versionId: string) => void;
  onLegalDescriptionGenerate?: (description: string, feature: GeoJSONFeature) => void;
  existingFeatures?: GeoJSONFeature[];
  snapDistance?: number; // Distance in meters for snapping
  enableSnapping?: boolean;
  enableVersioning?: boolean;
  enableSplitJoin?: boolean;
  enablePrecisionTools?: boolean;
  draw?: {
    polyline?: L.DrawOptions.PolylineOptions | false;
    polygon?: L.DrawOptions.PolygonOptions | false;
    rectangle?: L.DrawOptions.RectangleOptions | false;
    circle?: L.DrawOptions.CircleOptions | false;
    marker?: L.DrawOptions.MarkerOptions | false;
    circlemarker?: L.DrawOptions.CircleMarkerOptions | false;
  };
  edit?: {
    featureGroup?: L.FeatureGroup;
    edit?: L.DrawOptions.EditHandlerOptions | false;
    remove?: L.DrawOptions.DeleteHandlerOptions | false;
  };
}

/**
 * Advanced drawing control with snapping, versioning, and specialized parcel editing tools
 */
export function AdvancedDrawControl({
  position = 'topleft',
  onFeatureCreate,
  onFeatureEdit,
  onFeatureDelete,
  onVersionChange,
  onLegalDescriptionGenerate,
  existingFeatures = [],
  snapDistance = 10, // meters
  enableSnapping = true,
  enableVersioning = true,
  enableSplitJoin = true,
  enablePrecisionTools = true,
  draw,
  edit,
}: AdvancedDrawControlProps) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const mouseMarkerRef = useRef<L.CircleMarker | null>(null);
  const snapMarkerRef = useRef<L.CircleMarker | null>(null);
  const versionTrackerRef = useRef<FeatureVersionTracker>(new FeatureVersionTracker());
  const [activeDrawing, setActiveDrawing] = useState(false);
  const [activeEditing, setActiveEditing] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [showLegalDialog, setShowLegalDialog] = useState(false);
  const [legalDescription, setLegalDescription] = useState('');
  const { toast } = useToast();
  
  // Initialize the feature group and draw control
  useEffect(() => {
    // Initialize the FeatureGroup to store editable layers
    if (!featureGroupRef.current) {
      featureGroupRef.current = edit?.featureGroup || new L.FeatureGroup();
      map.addLayer(featureGroupRef.current);
    }

    const featureGroup = featureGroupRef.current;

    // Initialize draw control with enhanced options
    const drawOptions = {
      position,
      draw: {
        polyline: {
          shapeOptions: {
            color: '#3B82F6',
            weight: 4
          },
          showLength: true,
          metric: true
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#EF4444',
            message: '<strong>Error:</strong> Polygon edges cannot cross!'
          },
          shapeOptions: {
            color: '#3B82F6',
            weight: 2,
            fillOpacity: 0.2
          },
          showArea: true,
          metric: true
        },
        rectangle: {
          shapeOptions: {
            color: '#3B82F6',
            weight: 2,
            fillOpacity: 0.2
          },
          showArea: true,
          metric: true
        },
        circle: {
          shapeOptions: {
            color: '#3B82F6',
            weight: 2,
            fillOpacity: 0.2
          },
          metric: true
        },
        circlemarker: {
          radius: 4,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.5
        },
        marker: {
          icon: new L.Icon.Default()
        },
        ...draw,
      },
      edit: {
        featureGroup,
        edit: true,
        remove: true,
        ...edit,
      },
    };

    drawControlRef.current = new L.Control.Draw(drawOptions);
    map.addControl(drawControlRef.current);
    
    // Create mouse marker for snapping visualization
    if (enableSnapping && !mouseMarkerRef.current) {
      mouseMarkerRef.current = L.circleMarker([0, 0], {
        radius: 4,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 1,
        opacity: 1,
        weight: 1
      }).addTo(map);
      mouseMarkerRef.current.setOpacity(0);
    }
    
    // Create snap indicator marker
    if (enableSnapping && !snapMarkerRef.current) {
      snapMarkerRef.current = L.circleMarker([0, 0], {
        radius: 6,
        color: '#10B981',
        fillColor: '#10B981',
        fillOpacity: 1,
        opacity: 1,
        weight: 2
      }).addTo(map);
      snapMarkerRef.current.setOpacity(0);
    }
    
    // Return cleanup function
    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      
      if (mouseMarkerRef.current) {
        map.removeLayer(mouseMarkerRef.current);
        mouseMarkerRef.current = null;
      }
      
      if (snapMarkerRef.current) {
        map.removeLayer(snapMarkerRef.current);
        snapMarkerRef.current = null;
      }
    };
  }, [map, position, draw, edit, enableSnapping]);
  
  // Event handlers for draw events
  useEffect(() => {
    // Event handler for draw:created
    const handleCreated = (e: L.LeafletEvent) => {
      if (!featureGroupRef.current) return;
      
      featureGroupRef.current.addLayer(e.layer);
      
      if (onFeatureCreate) {
        const geoJSON = e.layer.toGeoJSON() as GeoJSONFeature;
        
        // Ensure the feature has a unique ID
        if (!geoJSON.properties) {
          geoJSON.properties = {};
        }
        
        if (!geoJSON.properties.id) {
          geoJSON.properties.id = `feature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Add layer type to properties
        if (e.layerType) {
          geoJSON.properties.type = e.layerType;
        }
        
        // Store the feature in version tracker
        if (enableVersioning) {
          versionTrackerRef.current.addVersion(
            geoJSON.properties.id,
            geoJSON,
            'Initial creation'
          );
        }
        
        // Store layer reference in properties for later retrieval
        (e.layer as any)._featureId = geoJSON.properties.id;
        
        onFeatureCreate(geoJSON);
      }
    };

    // Event handler for draw:edited
    const handleEdited = (e: L.LeafletEvent) => {
      if (onFeatureEdit && e.layers) {
        const editedFeatures: GeoJSONFeature[] = [];
        e.layers.getLayers().forEach((layer: any) => {
          const geoJSON = layer.toGeoJSON() as GeoJSONFeature;
          
          // Ensure feature has proper properties
          if (!geoJSON.properties) {
            geoJSON.properties = {};
          }
          
          if (!geoJSON.properties.id && layer._featureId) {
            geoJSON.properties.id = layer._featureId;
          }
          
          // Handle versioning
          if (enableVersioning && geoJSON.properties.id) {
            if (dialogOpen) {
              // Dialog is already open, just update the selected feature
              setSelectedFeature(geoJSON);
            } else {
              // Show dialog for version description
              setSelectedFeature(geoJSON);
              setVersionDescription('');
              setDialogOpen(true);
            }
          }
          
          editedFeatures.push(geoJSON);
        });
        
        if (!dialogOpen) {
          onFeatureEdit(editedFeatures);
        }
      }
    };

    // Event handler for draw:deleted
    const handleDeleted = (e: L.LeafletEvent) => {
      if (onFeatureDelete && e.layers) {
        const deletedFeatures: GeoJSONFeature[] = [];
        e.layers.getLayers().forEach((layer: any) => {
          const geoJSON = layer.toGeoJSON() as GeoJSONFeature;
          
          // If feature has an ID, add it to list of deleted features
          if (layer._featureId && (!geoJSON.properties || !geoJSON.properties.id)) {
            if (!geoJSON.properties) {
              geoJSON.properties = {};
            }
            geoJSON.properties.id = layer._featureId;
          }
          
          deletedFeatures.push(geoJSON);
        });
        
        onFeatureDelete(deletedFeatures);
      }
    };
    
    // Event handlers for draw states
    const handleDrawStart = (e: L.LeafletEvent) => {
      setActiveDrawing(true);
    };
    
    const handleDrawStop = (e: L.LeafletEvent) => {
      setActiveDrawing(false);
      if (mouseMarkerRef.current) {
        mouseMarkerRef.current.setOpacity(0);
      }
      if (snapMarkerRef.current) {
        snapMarkerRef.current.setOpacity(0);
      }
    };
    
    const handleEditStart = (e: L.LeafletEvent) => {
      setActiveEditing(true);
    };
    
    const handleEditStop = (e: L.LeafletEvent) => {
      setActiveEditing(false);
      if (mouseMarkerRef.current) {
        mouseMarkerRef.current.setOpacity(0);
      }
      if (snapMarkerRef.current) {
        snapMarkerRef.current.setOpacity(0);
      }
    };
    
    // Attach event handlers
    map.on(CREATED, handleCreated);
    map.on(EDITED, handleEdited);
    map.on(DELETED, handleDeleted);
    map.on(DRAWSTART, handleDrawStart);
    map.on(DRAWSTOP, handleDrawStop);
    map.on(EDITSTART, handleEditStart);
    map.on(EDITSTOP, handleEditStop);
    
    // Return cleanup function
    return () => {
      map.off(CREATED, handleCreated);
      map.off(EDITED, handleEdited);
      map.off(DELETED, handleDeleted);
      map.off(DRAWSTART, handleDrawStart);
      map.off(DRAWSTOP, handleDrawStop);
      map.off(EDITSTART, handleEditStart);
      map.off(EDITSTOP, handleEditStop);
    };
  }, [map, onFeatureCreate, onFeatureEdit, onFeatureDelete, enableVersioning, dialogOpen]);
  
  // Set up snapping functionality
  useEffect(() => {
    if (!enableSnapping) return;
    
    // Event handler for mouse move to implement snapping
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!activeDrawing && !activeEditing) return;
      
      // Update mouse marker position
      if (mouseMarkerRef.current) {
        mouseMarkerRef.current.setLatLng(e.latlng);
        mouseMarkerRef.current.setOpacity(1);
      }
      
      // Try to snap to existing features
      const point: [number, number] = [e.latlng.lng, e.latlng.lat];
      
      // Find nearest snappable point
      for (const feature of existingFeatures) {
        const snappedPoint = canSnapToFeature(point, feature, snapDistance);
        
        if (snappedPoint) {
          // Update snap marker to show snap point
          if (snapMarkerRef.current) {
            snapMarkerRef.current.setLatLng(L.latLng(snappedPoint[1], snappedPoint[0]));
            snapMarkerRef.current.setOpacity(1);
          }
          
          // Modify the current draw handler to use the snapped point
          if (activeDrawing && (e as any).originalEvent) {
            // This is a simplified approach - for full implementation,
            // you would need to modify the Leaflet.Draw handlers directly
            const originalEvent = (e as any).originalEvent;
            originalEvent.clientX = map.latLngToContainerPoint(L.latLng(snappedPoint[1], snappedPoint[0])).x;
            originalEvent.clientY = map.latLngToContainerPoint(L.latLng(snappedPoint[1], snappedPoint[0])).y;
          }
          
          return; // Stop after finding the first snap point
        }
      }
      
      // Hide snap marker if no snap point found
      if (snapMarkerRef.current) {
        snapMarkerRef.current.setOpacity(0);
      }
    };
    
    // Attach mouse move handler
    map.on('mousemove', handleMouseMove);
    
    // Return cleanup function
    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [map, activeDrawing, activeEditing, existingFeatures, enableSnapping, snapDistance]);
  
  // Handle versioning confirm/cancel
  function handleVersionConfirm() {
    if (!selectedFeature || !selectedFeature.properties?.id) return;
    
    const featureId = selectedFeature.properties.id;
    
    // Add version with description
    versionTrackerRef.current.addVersion(
      featureId,
      selectedFeature,
      versionDescription || 'Edited feature'
    );
    
    const newVersion = versionTrackerRef.current.getLatestVersion(featureId);
    
    if (newVersion && onVersionChange) {
      onVersionChange(featureId, newVersion.id);
    }
    
    if (onFeatureEdit) {
      onFeatureEdit([selectedFeature]);
    }
    
    setDialogOpen(false);
    setSelectedFeature(null);
    
    toast({
      title: "Version saved",
      description: "Feature changes have been versioned",
    });
  }
  
  function handleVersionCancel() {
    setDialogOpen(false);
    setSelectedFeature(null);
  }
  
  // Generate legal description for selected feature
  function handleGenerateLegalDescription() {
    if (!selectedFeature) {
      toast({
        title: "No feature selected",
        description: "Please select a polygon feature to generate a legal description",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedFeature.geometry.type !== 'Polygon' && selectedFeature.geometry.type !== 'MultiPolygon') {
      toast({
        title: "Invalid feature type",
        description: "Legal descriptions can only be generated for polygon features",
        variant: "destructive"
      });
      return;
    }
    
    const description = generateLegalDescription(selectedFeature);
    setLegalDescription(description);
    setShowLegalDialog(true);
    
    if (onLegalDescriptionGenerate) {
      onLegalDescriptionGenerate(description, selectedFeature);
    }
  }
  
  // Additional precision tools for advanced editing
  return (
    <>
      {/* Advanced tools toolbar */}
      {enablePrecisionTools && (
        <div className="absolute top-14 left-2 z-[1000] bg-white rounded-md shadow-md p-1 flex flex-col gap-1">
          {enableSplitJoin && (
            <>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  // Split feature logic would be implemented here
                  toast({
                    title: "Split Tool",
                    description: "Draw a line across a polygon to split it",
                  });
                }}
                title="Split Parcel"
                disabled={!activeDrawing && !activeEditing}
              >
                <Scissors size={18} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  // Join features logic would be implemented here
                  toast({
                    title: "Join Tool",
                    description: "Select adjacent polygons to join them",
                  });
                }}
                title="Join Parcels"
                disabled={!activeDrawing && !activeEditing}
              >
                <Combine size={18} />
              </Button>
              <div className="w-full h-px bg-gray-200 my-1"></div>
            </>
          )}
          
          <Button
            size="icon"
            variant="outline"
            onClick={handleGenerateLegalDescription}
            title="Generate Legal Description"
          >
            <FileText size={18} />
          </Button>
          
          {enableVersioning && (
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                // Version history logic would be implemented here
                toast({
                  title: "Version History",
                  description: "View and restore previous versions",
                });
              }}
              title="Version History"
            >
              <Undo2 size={18} />
            </Button>
          )}
          
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              // Precision measurement logic would be implemented here
              toast({
                title: "Precision Measurement",
                description: "Measure distances and angles precisely",
              });
            }}
            title="Precision Measurement"
          >
            <Ruler size={18} />
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            onClick={() => {
              // Grid overlay logic would be implemented here
              toast({
                title: "Grid Overlay",
                description: "Show/hide measurement grid",
              });
            }}
            title="Grid Overlay"
          >
            <Grid size={18} />
          </Button>
        </div>
      )}
      
      {/* Version dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Feature Version</DialogTitle>
            <DialogDescription>
              Provide a description of the changes made to this feature.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version-description">Change Description</Label>
              <Input
                id="version-description"
                placeholder="Describe your changes..."
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleVersionCancel}>Cancel</Button>
            <Button onClick={handleVersionConfirm}>Save Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Legal description dialog */}
      <Dialog open={showLegalDialog} onOpenChange={setShowLegalDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Legal Description</DialogTitle>
            <DialogDescription>
              The following is a legal description of the selected parcel.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto border rounded p-3 whitespace-pre-wrap font-mono text-sm">
            {legalDescription}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                // Copy to clipboard
                navigator.clipboard.writeText(legalDescription);
                toast({
                  title: "Copied",
                  description: "Legal description copied to clipboard",
                });
              }}
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setShowLegalDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AdvancedDrawControl;