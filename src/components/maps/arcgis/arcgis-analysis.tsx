import React, { useEffect, useState } from 'react';
import { loadModules } from '@esri/react-arcgis';

type AnalysisType = 'buffer' | 'clip' | 'overlay' | 'dissolve' | 'union' | 'intersect' | 'difference' | 'nearest';

interface AnalysisProps {
  view: __esri.MapView;
  analysisType: AnalysisType;
  inputLayer: __esri.Layer | __esri.Graphic[] | string; // URL, layer ref, or graphics
  parameters: Record<string, any>;
  returnGraphics?: boolean;
  outputLayer?: __esri.GraphicsLayer;
  onAnalysisComplete?: (result: __esri.FeatureSet | __esri.Graphic[] | any) => void;
  onAnalysisError?: (error: Error) => void;
  onAnalysisStart?: () => void;
}

export const ArcGISAnalysis: React.FC<AnalysisProps> = ({
  view,
  analysisType,
  inputLayer,
  parameters,
  returnGraphics = true,
  outputLayer,
  onAnalysisComplete,
  onAnalysisError,
  onAnalysisStart
}) => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!view) return;

    const runAnalysis = async () => {
      try {
        setLoading(true);
        if (onAnalysisStart) onAnalysisStart();
        
        // Load necessary modules for analysis
        const [geometryEngine, GeometryService, BufferParameters, Graphic, GraphicsLayer] = await loadModules([
          'esri/geometry/geometryEngine',
          'esri/tasks/GeometryService',
          'esri/tasks/support/BufferParameters',
          'esri/Graphic',
          'esri/layers/GraphicsLayer'
        ]);

        // Create output layer if needed and not provided
        let outputGraphicsLayer = outputLayer;
        if (returnGraphics && !outputGraphicsLayer) {
          outputGraphicsLayer = new GraphicsLayer({
            id: `analysis-result-${Date.now()}`,
            title: 'Analysis Results'
          });
          view.map.add(outputGraphicsLayer);
        }

        // Convert input to appropriate format
        let inputGeometries: __esri.Geometry[] = [];
        if (typeof inputLayer === 'string') {
          // URL processing logic would go here
          console.error('URL input not implemented');
        } else if (Array.isArray(inputLayer)) {
          // Array of graphics
          inputGeometries = inputLayer.map(graphic => graphic.geometry);
        } else if ('type' in inputLayer && inputLayer.type === 'graphics-layer') {
          // Graphics layer
          inputGeometries = (inputLayer as __esri.GraphicsLayer).graphics.toArray().map(g => g.geometry);
        } else if ('queryFeatures' in inputLayer) {
          // Feature layer
          const featureLayer = inputLayer as __esri.FeatureLayer;
          const result = await featureLayer.queryFeatures({
            where: '1=1',
            outFields: ['*'],
            returnGeometry: true
          });
          inputGeometries = result.features.map(f => f.geometry);
        }

        if (inputGeometries.length === 0) {
          throw new Error('No valid input geometries found');
        }

        let result;
        
        switch (analysisType) {
          case 'buffer':
            // Client-side buffer using geometryEngine
            const distance = parameters.distance || 1000; // meters
            const unit = parameters.unit || 'meters';
            const unionResult = parameters.union === true;
            
            result = geometryEngine.buffer(
              inputGeometries.length === 1 ? inputGeometries[0] : inputGeometries, 
              distance, 
              unit, 
              unionResult
            );
            break;
            
          case 'union':
            result = geometryEngine.union(inputGeometries);
            break;
            
          case 'intersect':
            if (inputGeometries.length < 2) {
              throw new Error('Intersection requires at least two geometries');
            }
            const baseGeom = inputGeometries[0];
            const intersectGeoms = inputGeometries.slice(1);
            result = geometryEngine.intersect(baseGeom, intersectGeoms);
            break;
            
          case 'difference':
            if (inputGeometries.length < 2) {
              throw new Error('Difference requires at least two geometries');
            }
            result = geometryEngine.difference(inputGeometries[0], inputGeometries[1]);
            break;
            
          case 'nearest':
            // This would implement finding the nearest features
            console.error('Nearest analysis not implemented');
            break;
            
          default:
            throw new Error(`Unsupported analysis type: ${analysisType}`);
        }

        // Add result to graphics layer if requested
        if (returnGraphics && result && outputGraphicsLayer) {
          const symbol = parameters.symbol || {
            type: "simple-fill",
            color: [140, 200, 255, 0.5],
            outline: {
              color: [0, 0, 255],
              width: 2
            }
          };
          
          if (Array.isArray(result)) {
            // Multiple results
            const graphics = result.map(geom => new Graphic({
              geometry: geom,
              symbol
            }));
            outputGraphicsLayer.addMany(graphics);
          } else {
            // Single result
            const graphic = new Graphic({
              geometry: result,
              symbol
            });
            outputGraphicsLayer.add(graphic);
          }
        }

        setAnalysisResult(result);
        setLoading(false);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
        
        return result;
      } catch (error) {
        console.error('Error in spatial analysis:', error);
        setLoading(false);
        if (onAnalysisError) {
          onAnalysisError(error as Error);
        }
      }
    };

    // Run analysis when all required props are available
    if (analysisType && inputLayer && parameters) {
      runAnalysis();
    }
  }, [view, analysisType, inputLayer, parameters]);

  return null;
};

export default ArcGISAnalysis;