import React, { useEffect, useRef } from 'react';

interface ArcGISSketchProps {
  view: __esri.MapView;
  onSketchComplete?: (geometry: __esri.Geometry) => void;
  onSketchUpdate?: (geometry: __esri.Geometry) => void;
  onSketchCreate?: (graphic: __esri.Graphic) => void;
  onSketchDelete?: (graphic: __esri.Graphic) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const ArcGISSketch: React.FC<ArcGISSketchProps> = ({
  view,
  onSketchComplete,
  onSketchUpdate,
  onSketchCreate,
  onSketchDelete,
  position = 'top-right'
}) => {
  const sketchRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  
  useEffect(() => {
    // Import necessary modules
    Promise.all([
      import('@arcgis/core/widgets/Sketch'),
      import('@arcgis/core/layers/GraphicsLayer'),
      import('@arcgis/core/widgets/Expand')
    ]).then(([
      { default: Sketch },
      { default: GraphicsLayer },
      { default: Expand }
    ]) => {
      // Create a graphics layer to store sketch graphics
      const layer = new GraphicsLayer({
        title: 'Sketch Layer'
      });
      
      view.map.add(layer);
      layerRef.current = layer;
      
      // Create the sketch widget
      const sketch = new Sketch({
        view,
        layer,
        creationMode: 'single',
        defaultCreateOptions: {
          mode: 'hybrid' // allows freehand and shape drawing
        },
        visibleElements: {
          createTools: {
            point: true,
            polyline: true,
            polygon: true,
            rectangle: true,
            circle: true
          },
          selectionTools: {
            'lasso-selection': true,
            'rectangle-selection': true
          },
          undoRedoMenu: true,
          settingsMenu: true
        }
      });
      
      // Create an expand widget to hold the sketch widget
      const expand = new Expand({
        view,
        content: sketch,
        expandIconClass: 'esri-icon-edit',
        expandTooltip: 'Sketch Tools'
      });
      
      // Add the expand widget to the UI
      view.ui.add(expand, position);
      
      // Set up event handlers
      if (onSketchComplete) {
        sketch.on('create', (event) => {
          if (event.state === 'complete') {
            onSketchComplete(event.graphic.geometry);
          }
        });
      }
      
      if (onSketchUpdate) {
        sketch.on('update', (event) => {
          if (event.state === 'complete') {
            onSketchUpdate(event.graphics[0].geometry);
          }
        });
      }
      
      if (onSketchCreate) {
        sketch.on('create', (event) => {
          if (event.state === 'complete') {
            onSketchCreate(event.graphic);
          }
        });
      }
      
      if (onSketchDelete) {
        sketch.on('delete', (event) => {
          event.graphics.forEach(graphic => {
            if (onSketchDelete) onSketchDelete(graphic);
          });
        });
      }
      
      // Store reference for cleanup
      sketchRef.current = { sketch, expand };
      
    }).catch(error => {
      console.error('Error loading ArcGIS sketch tools:', error);
    });
    
    // Cleanup function
    return () => {
      if (sketchRef.current) {
        const { sketch, expand } = sketchRef.current;
        if (expand) {
          view.ui.remove(expand);
        }
        if (sketch) {
          sketch.destroy();
        }
      }
      
      if (layerRef.current) {
        view.map.remove(layerRef.current);
      }
    };
  }, [view, position]);
  
  // This component doesn't render anything directly
  return null;
};

export default ArcGISSketch;