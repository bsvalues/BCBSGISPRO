import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Map, 
  Database, 
  Search, 
  Layers, 
  SquareSelect, 
  Ruler, 
  Move, 
  Download,
  FileDown,
  Info,
  ZoomIn,
  ZoomOut,
  PieChart,
  LineChart,
  BarChart4 
} from 'lucide-react';
import useBentonArcGIS from '@/hooks/use-benton-arcgis';
import { useToast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Map layer types supported by the viewer
export enum MapLayerType {
  PARCELS = 'parcels',
  ZONING = 'zoning',
  AERIAL = 'aerial',
  STREETS = 'streets',
  TAX_CODES = 'taxCodes',
  PLATS = 'plats',
  TERRAIN = 'terrain',
  HEAT_MAP = 'heatMap'
}

// Tool types for the map interface
export enum MapToolType {
  PAN = 'pan',
  SELECT = 'select',
  MEASURE = 'measure',
  IDENTIFY = 'identify',
  ZOOM = 'zoom',
  DRAW = 'draw'
}

// Measurement types
export enum MeasurementType {
  DISTANCE = 'distance',
  AREA = 'area',
  PERIMETER = 'perimeter'
}

// Props for the ParcelViewer component
interface EnhancedParcelViewerProps {
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
  height?: string | number;
  showControls?: boolean;
  showLayers?: boolean;
  showTools?: boolean;
  showSearch?: boolean;
  showAnalytics?: boolean;
  onParcelSelect?: (parcelData: any) => void;
  onParcelHover?: (parcelData: any) => void;
  workflowId?: number;
}

export function EnhancedParcelViewer({
  initialCenter = [-119.2290, 46.2503], // Default to Benton County center
  initialZoom = 10,
  height = '600px',
  showControls = true,
  showLayers = true,
  showTools = true,
  showSearch = true,
  showAnalytics = false,
  onParcelSelect,
  onParcelHover,
  workflowId
}: EnhancedParcelViewerProps) {
  // Map and container references
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // State for map features
  const [mapLayers, setMapLayers] = useState<{ [key in MapLayerType]?: boolean }>({
    [MapLayerType.PARCELS]: true,
    [MapLayerType.STREETS]: true,
    [MapLayerType.AERIAL]: false,
    [MapLayerType.ZONING]: false,
    [MapLayerType.TAX_CODES]: false,
    [MapLayerType.PLATS]: false,
    [MapLayerType.TERRAIN]: false,
    [MapLayerType.HEAT_MAP]: false
  });
  
  const [activeTool, setActiveTool] = useState<MapToolType>(MapToolType.PAN);
  const [measurementType, setMeasurementType] = useState<MeasurementType>(MeasurementType.DISTANCE);
  const [searchInput, setSearchInput] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layerOpacity, setLayerOpacity] = useState<{ [key in MapLayerType]?: number }>({
    [MapLayerType.PARCELS]: 1.0,
    [MapLayerType.AERIAL]: 0.7,
    [MapLayerType.ZONING]: 0.5
  });
  
  // Selected and hovered parcel state
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [hoveredParcel, setHoveredParcel] = useState<any>(null);
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsView, setAnalyticsView] = useState<'property' | 'tax' | 'zoning'>('property');
  
  // Get the Benton ArcGIS client
  const { 
    isLoading, 
    error, 
    getParcelByNumber, 
    searchParcelsByOwner, 
    searchParcelsByAddress,
    getParcelsInBounds,
    transformToGeoJSON
  } = useBentonArcGIS();
  
  const { toast } = useToast();
  
  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Check for Mapbox token
    if (!mapboxgl.accessToken) {
      // In a real implementation, you would get this from environment variables
      // or secure storage. For this demo, we'll use a temporary token.
      mapboxgl.accessToken = 'pk.YOUR_REAL_MAPBOX_TOKEN';
    }
    
    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11', // Default style
      center: initialCenter,
      zoom: initialZoom
    });
    
    // Add navigation controls
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }
    
    // Setup event handlers
    map.current.on('load', () => {
      setMapLoaded(true);
      setupMapLayers();
    });
    
    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Setup map layers after the map is loaded
  const setupMapLayers = () => {
    if (!map.current || !mapLoaded) return;
    
    // Add Benton County parcel source
    map.current.addSource('benton-parcels', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    // Add parcel layer
    map.current.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'benton-parcels',
      layout: {},
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#3b82f6', // Blue for selected
          ['boolean', ['feature-state', 'hover'], false],
          '#10b981', // Green for hover
          '#6b7280' // Default gray
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          0.6,
          ['boolean', ['feature-state', 'hover'], false],
          0.4,
          0.15
        ]
      }
    });
    
    // Add parcel outline layer
    map.current.addLayer({
      id: 'parcels-outline',
      type: 'line',
      source: 'benton-parcels',
      layout: {},
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#1d4ed8', // Darker blue for selected
          ['boolean', ['feature-state', 'hover'], false],
          '#059669', // Darker green for hover
          '#4b5563' // Default darker gray
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          2,
          ['boolean', ['feature-state', 'hover'], false],
          1.5,
          0.5
        ]
      }
    });
    
    // Add click event for parcel selection
    map.current.on('click', 'parcels-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const parcelId = feature.id;
        
        // Update feature state for rendering
        if (selectedParcel) {
          map.current?.setFeatureState(
            { source: 'benton-parcels', id: selectedParcel.id },
            { selected: false }
          );
        }
        
        map.current?.setFeatureState(
          { source: 'benton-parcels', id: parcelId },
          { selected: true }
        );
        
        // Set the selected parcel and notify parent component
        setSelectedParcel(feature);
        if (onParcelSelect) {
          onParcelSelect(feature);
        }
        
        // Show parcel details in a toast for this demo
        toast({
          title: 'Parcel Selected',
          description: `Parcel ID: ${feature.properties.PARCELNBR || parcelId}`,
          variant: 'default'
        });
      }
    });
    
    // Add mousemove event for parcel hover
    map.current.on('mousemove', 'parcels-fill', (e) => {
      if (e.features && e.features.length > 0) {
        if (hoveredParcel) {
          map.current?.setFeatureState(
            { source: 'benton-parcels', id: hoveredParcel.id },
            { hover: false }
          );
        }
        
        const feature = e.features[0];
        const parcelId = feature.id;
        
        map.current?.setFeatureState(
          { source: 'benton-parcels', id: parcelId },
          { hover: true }
        );
        
        setHoveredParcel(feature);
        if (onParcelHover) {
          onParcelHover(feature);
        }
        
        // Update cursor style
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });
    
    // Reset hover state when mouse leaves the parcels layer
    map.current.on('mouseleave', 'parcels-fill', () => {
      if (hoveredParcel) {
        map.current?.setFeatureState(
          { source: 'benton-parcels', id: hoveredParcel.id },
          { hover: false }
        );
      }
      
      setHoveredParcel(null);
      map.current?.getCanvas().style.cursor = '';
    });
    
    // Load initial data
    loadParcelsInView();
  };
  
  // Load parcels in the current map view
  const loadParcelsInView = async () => {
    if (!map.current || !mapLoaded) return;
    
    const bounds = map.current.getBounds();
    
    try {
      const parcels = await getParcelsInBounds(
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      );
      
      // Convert to GeoJSON and update the source
      const geoJson = transformToGeoJSON({ features: parcels });
      
      if (map.current) {
        const source = map.current.getSource('benton-parcels') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geoJson);
        }
      }
    } catch (error) {
      console.error('Error loading parcels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parcel data for the current view',
        variant: 'destructive'
      });
    }
  };
  
  // Handle map layer visibility toggle
  const toggleLayer = (layerType: MapLayerType) => {
    setMapLayers(prev => ({
      ...prev,
      [layerType]: !prev[layerType]
    }));
    
    // In a real implementation, you would update the map layers here
    // based on the visibility state
  };
  
  // Handle tool selection
  const selectTool = (tool: MapToolType) => {
    setActiveTool(tool);
    
    // In a real implementation, you would configure the map interaction based on the selected tool
    // For example, enabling drawing mode or measurement mode
  };
  
  // Handle measurement type selection
  const selectMeasurementType = (type: MeasurementType) => {
    setMeasurementType(type);
    
    // In a real implementation, you would update the measurement tool configuration
  };
  
  // Handle parcel search
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    
    try {
      // Determine search type based on input
      if (/^\d+$/.test(searchInput)) {
        // Looks like a parcel number
        const parcel = await getParcelByNumber(searchInput);
        if (parcel) {
          // Zoom to the parcel
          if (map.current && parcel.geometry) {
            // Convert parcel to GeoJSON and get its bounds
            const geoJson = transformToGeoJSON({ features: [parcel] });
            
            // For demo purposes, we'll just zoom to a fixed point
            // In a real implementation, you would calculate the bounds
            map.current.flyTo({
              center: initialCenter,
              zoom: 16
            });
            
            // Select the parcel
            setSelectedParcel(parcel);
            if (onParcelSelect) {
              onParcelSelect(parcel);
            }
          }
        } else {
          toast({
            title: 'Not Found',
            description: `No parcel found with number: ${searchInput}`,
            variant: 'destructive'
          });
        }
      } else if (searchInput.includes(' ')) {
        // Looks like an address
        const parcels = await searchParcelsByAddress(searchInput);
        if (parcels.length > 0) {
          // Show first result
          const parcel = parcels[0];
          if (map.current && parcel.geometry) {
            map.current.flyTo({
              center: initialCenter,
              zoom: 16
            });
            
            setSelectedParcel(parcel);
            if (onParcelSelect) {
              onParcelSelect(parcel);
            }
          }
          
          toast({
            title: 'Search Results',
            description: `Found ${parcels.length} parcels for address: ${searchInput}`,
            variant: 'default'
          });
        } else {
          toast({
            title: 'Not Found',
            description: `No parcels found for address: ${searchInput}`,
            variant: 'destructive'
          });
        }
      } else {
        // Assume it's an owner name
        const parcels = await searchParcelsByOwner(searchInput);
        if (parcels.length > 0) {
          // Show first result
          const parcel = parcels[0];
          if (map.current && parcel.geometry) {
            map.current.flyTo({
              center: initialCenter,
              zoom: 16
            });
            
            setSelectedParcel(parcel);
            if (onParcelSelect) {
              onParcelSelect(parcel);
            }
          }
          
          toast({
            title: 'Search Results',
            description: `Found ${parcels.length} parcels for owner: ${searchInput}`,
            variant: 'default'
          });
        } else {
          toast({
            title: 'Not Found',
            description: `No parcels found for owner: ${searchInput}`,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'An error occurred while searching for parcels',
        variant: 'destructive'
      });
    }
  };
  
  // Handle layer opacity change
  const handleOpacityChange = (layerType: MapLayerType, value: number[]) => {
    const opacity = value[0];
    setLayerOpacity(prev => ({
      ...prev,
      [layerType]: opacity
    }));
    
    // In a real implementation, you would update the layer opacity
    // For example:
    // if (map.current && mapLoaded) {
    //   map.current.setPaintProperty(`${layerType}-layer`, 'fill-opacity', opacity);
    // }
  };
  
  // Handle export of map data
  const handleExportData = () => {
    if (!selectedParcel) {
      toast({
        title: 'No Selection',
        description: 'Please select a parcel to export its data',
        variant: 'destructive'
      });
      return;
    }
    
    // In a real implementation, you would create and download a file
    // with the parcel data in various formats (GeoJSON, CSV, etc.)
    console.log('Exporting data for:', selectedParcel);
    
    toast({
      title: 'Export Started',
      description: 'Your data is being prepared for download',
      variant: 'default'
    });
  };
  
  // UI rendering
  return (
    <div className="flex flex-col space-y-4">
      {/* Map container */}
      <div 
        ref={mapContainer} 
        style={{ 
          height, 
          width: '100%', 
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}
      />
      
      {/* Map controls */}
      <div className="flex flex-wrap gap-4">
        {/* Search box */}
        {showSearch && (
          <Card className="p-3 flex-1 min-w-[300px]">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by parcel #, owner, or address"
                  className="w-full px-3 py-2 border rounded-md"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                Search
              </Button>
            </div>
          </Card>
        )}
        
        {/* Layer controls */}
        {showLayers && (
          <Card className="p-3 flex-1 min-w-[300px]">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Layers className="h-4 w-4 mr-1" /> Map Layers
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(mapLayers).map(([layer, isVisible]) => (
                <div key={layer} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isVisible}
                      onCheckedChange={() => toggleLayer(layer as MapLayerType)}
                    />
                    <Label>{layer}</Label>
                  </div>
                  {isVisible && (
                    <Slider
                      value={[layerOpacity[layer as MapLayerType] || 1]}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-24"
                      onValueChange={(value) => handleOpacityChange(layer as MapLayerType, value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* Tool controls */}
        {showTools && (
          <Card className="p-3 flex-1 min-w-[300px]">
            <h3 className="text-sm font-medium mb-2">Map Tools</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTool === MapToolType.PAN ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectTool(MapToolType.PAN)}
              >
                <Move className="h-4 w-4 mr-1" /> Pan
              </Button>
              <Button
                variant={activeTool === MapToolType.SELECT ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectTool(MapToolType.SELECT)}
              >
                <SquareSelect className="h-4 w-4 mr-1" /> Select
              </Button>
              <Button
                variant={activeTool === MapToolType.MEASURE ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectTool(MapToolType.MEASURE)}
              >
                <Ruler className="h-4 w-4 mr-1" /> Measure
              </Button>
              <Button
                variant={activeTool === MapToolType.IDENTIFY ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectTool(MapToolType.IDENTIFY)}
              >
                <Info className="h-4 w-4 mr-1" /> Identify
              </Button>
              <Button
                variant={activeTool === MapToolType.ZOOM ? 'default' : 'outline'}
                size="sm"
                onClick={() => selectTool(MapToolType.ZOOM)}
              >
                <ZoomIn className="h-4 w-4 mr-1" /> Zoom
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <FileDown className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
            
            {/* Measurement tools, visible only when measure tool is active */}
            {activeTool === MapToolType.MEASURE && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant={measurementType === MeasurementType.DISTANCE ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectMeasurementType(MeasurementType.DISTANCE)}
                >
                  Distance
                </Button>
                <Button
                  variant={measurementType === MeasurementType.AREA ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectMeasurementType(MeasurementType.AREA)}
                >
                  Area
                </Button>
                <Button
                  variant={measurementType === MeasurementType.PERIMETER ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectMeasurementType(MeasurementType.PERIMETER)}
                >
                  Perimeter
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
      
      {/* Analytics panel */}
      {showAnalytics && selectedParcel && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Parcel Analytics</h3>
            <div className="flex space-x-2">
              <Button
                variant={analyticsView === 'property' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnalyticsView('property')}
              >
                <PieChart className="h-4 w-4 mr-1" /> Property
              </Button>
              <Button
                variant={analyticsView === 'tax' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnalyticsView('tax')}
              >
                <BarChart4 className="h-4 w-4 mr-1" /> Tax
              </Button>
              <Button
                variant={analyticsView === 'zoning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnalyticsView('zoning')}
              >
                <LineChart className="h-4 w-4 mr-1" /> Zoning
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* This would be replaced with actual charts and visualizations */}
            <Card className="p-3">
              <h4 className="font-medium text-sm mb-2">Parcel Information</h4>
              <div className="text-sm">
                <p className="grid grid-cols-2">
                  <span className="font-medium">Parcel ID:</span>
                  <span>{selectedParcel.properties?.PARCELNBR || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Owner:</span>
                  <span>{selectedParcel.properties?.OWNER_NAME || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Address:</span>
                  <span>{selectedParcel.properties?.FULLADDRESS || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Land Use:</span>
                  <span>{selectedParcel.properties?.LANDUSE || 'N/A'}</span>
                </p>
              </div>
            </Card>
            
            <Card className="p-3">
              <h4 className="font-medium text-sm mb-2">Assessment Values</h4>
              <div className="text-sm">
                <p className="grid grid-cols-2">
                  <span className="font-medium">Land Value:</span>
                  <span>${selectedParcel.properties?.LAND_VALUE || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Building Value:</span>
                  <span>${selectedParcel.properties?.BLDG_VALUE || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Total Value:</span>
                  <span>${selectedParcel.properties?.TOTAL_VALUE || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Property Class:</span>
                  <span>{selectedParcel.properties?.PROP_CLASS || 'N/A'}</span>
                </p>
              </div>
            </Card>
            
            <Card className="p-3">
              <h4 className="font-medium text-sm mb-2">Physical Attributes</h4>
              <div className="text-sm">
                <p className="grid grid-cols-2">
                  <span className="font-medium">Acres:</span>
                  <span>{selectedParcel.properties?.ACRES || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Zoning:</span>
                  <span>{selectedParcel.properties?.ZONING || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Year Built:</span>
                  <span>{selectedParcel.properties?.YEAR_BUILT || 'N/A'}</span>
                </p>
                <p className="grid grid-cols-2">
                  <span className="font-medium">Sq Feet:</span>
                  <span>{selectedParcel.properties?.SQFT || 'N/A'}</span>
                </p>
              </div>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}

export default EnhancedParcelViewer;