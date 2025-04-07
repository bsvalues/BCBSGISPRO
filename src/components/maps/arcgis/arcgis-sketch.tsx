import React, { useEffect, useState } from 'react';
import { loadModules } from '@esri/react-arcgis';

interface SketchProps {
  view: __esri.MapView;
  onSketchCreate?: (geometry: __esri.Geometry) => void;
  onSketchUpdate?: (geometry: __esri.Geometry) => void;
  onSketchDelete?: (geometry: __esri.Geometry) => void;
  onSketchComplete?: (geometry: __esri.Geometry) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ArcGISSketch: React.FC<SketchProps> = ({
  view,
  onSketchCreate,
  onSketchUpdate,
  onSketchDelete,
  onSketchComplete,
  position = 'top-right'
}) => {
  const [sketchLayer, setSketchLayer] = useState<__esri.GraphicsLayer | null>(null);
  const [sketchViewModel, setSketchViewModel] = useState<__esri.SketchViewModel | null>(null);
  
  useEffect(() => {
    if (!view) return;

    const loadSketch = async () => {
      try {
        // Load sketch modules
        const [GraphicsLayer, SketchViewModel, Expand, Sketch] = await loadModules([
          'esri/layers/GraphicsLayer',
          'esri/widgets/Sketch/SketchViewModel',
          'esri/widgets/Expand',
          'esri/widgets/Sketch'
        ]);

        // Create graphics layer for sketches
        const layer = new GraphicsLayer({
          id: 'sketch-layer',
          title: 'Sketches',
          listMode: 'show'
        });
        view.map.add(layer);
        setSketchLayer(layer);

        // Create sketch view model
        const svm = new SketchViewModel({
          view,
          layer,
          updateOnGraphicClick: true,
          defaultUpdateOptions: {
            toggleToolOnClick: false
          }
        });
        setSketchViewModel(svm);

        // Create and add sketch widget
        const sketchWidget = new Sketch({
          view,
          layer,
          viewModel: svm,
          creationMode: 'update'
        });

        // Wrap in expand widget for cleaner UI
        const sketchExpand = new Expand({
          view,
          content: sketchWidget,
          expandIconClass: 'esri-icon-edit',
          expandTooltip: 'Sketch Tools'
        });

        // Add to UI
        view.ui.add(sketchExpand, position);

        // Set up event handlers
        if (onSketchCreate) {
          svm.on('create', (event) => {
            if (event.state === 'complete') {
              onSketchCreate(event.graphic.geometry);
            }
          });
        }

        if (onSketchUpdate) {
          svm.on('update', (event) => {
            if (event.state === 'complete') {
              onSketchUpdate(event.graphics[0].geometry);
            }
          });
        }

        if (onSketchDelete) {
          sketchWidget.on('delete', (event) => {
            if (event.graphics.length > 0) {
              onSketchDelete(event.graphics[0].geometry);
            }
          });
        }

        if (onSketchComplete) {
          svm.on(['create', 'update'], (event) => {
            if (event.state === 'complete') {
              const geometry = event.type === 'create' 
                ? event.graphic.geometry 
                : event.graphics[0].geometry;
              onSketchComplete(geometry);
            }
          });
        }

        // Cleanup on unmount
        return () => {
          if (sketchWidget) {
            view.ui.remove(sketchExpand);
            sketchWidget.destroy();
          }
          if (svm) {
            svm.destroy();
          }
          if (layer && view.map) {
            view.map.remove(layer);
          }
        };
      } catch (error) {
        console.error('Error loading sketch tools:', error);
      }
    };

    loadSketch();
  }, [view]);

  return null;
};

export default ArcGISSketch;