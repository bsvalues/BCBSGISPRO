import React, { useEffect, useRef, useState } from 'react';

interface ArcGISSketchProps {
  view: any;
  onSketchComplete?: (geometry: any) => void;
  onSketchUpdate?: (geometry: any) => void;
  onSketchCreate?: (graphic: any) => void;
  onSketchDelete?: (graphic: any) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * ArcGIS Sketch Component - Simplified Version
 * 
 * This is a placeholder component that simulates ArcGIS sketch capabilities
 * without requiring the actual ArcGIS JavaScript API.
 * Replace with full implementation when ArcGIS Core is properly configured.
 */
const ArcGISSketchSimplified: React.FC<ArcGISSketchProps> = ({
  view,
  onSketchComplete,
  onSketchUpdate,
  onSketchCreate,
  onSketchDelete,
  position = 'top-right'
}) => {
  const sketchRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [sketchType, setSketchType] = useState<string | null>(null);
  
  // Simulate initialization
  useEffect(() => {
    console.log('Sketch module initialized (simulated)');
    
    // Create a simulated UI element for sketch tools
    const sketchContainer = document.createElement('div');
    sketchContainer.className = 'simulated-sketch-widget';
    sketchContainer.style.cssText = `
      position: absolute;
      ${position.includes('top') ? 'top: 10px;' : 'bottom: 10px;'}
      ${position.includes('right') ? 'right: 10px;' : 'left: 10px;'}
      background: rgba(255, 255, 255, 0.9);
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      padding: 8px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;
    
    // Add sketch tools buttons
    const tools = ['point', 'polyline', 'polygon', 'rectangle', 'circle'];
    tools.forEach(tool => {
      const button = document.createElement('button');
      button.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
      button.style.cssText = `
        padding: 6px 12px;
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      `;
      
      button.addEventListener('mouseover', () => {
        button.style.background = '#e0e0e0';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.background = sketchType === tool ? '#d0d0d0' : '#f0f0f0';
      });
      
      button.addEventListener('click', () => {
        // Reset all buttons
        sketchContainer.querySelectorAll('button').forEach((btn: any) => {
          btn.style.background = '#f0f0f0';
          btn.style.boxShadow = 'none';
        });
        
        // Activate the clicked button
        button.style.background = '#d0d0d0';
        button.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.2)';
        
        setActive(true);
        setSketchType(tool);
        console.log(`Sketch tool activated: ${tool} (simulated)`);
        
        // Generate a simulated geometry based on the tool type
        simulateSketch(tool);
      });
      
      sketchContainer.appendChild(button);
    });
    
    // Add a clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.cssText = `
      margin-top: 8px;
      padding: 6px 12px;
      background: #f8f8f8;
      border: 1px solid #ccc;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    `;
    
    clearButton.addEventListener('click', () => {
      console.log('Clearing sketches (simulated)');
      
      // Reset active state
      setActive(false);
      setSketchType(null);
      
      // Reset all tool buttons
      sketchContainer.querySelectorAll('button').forEach((btn: any) => {
        if (btn !== clearButton) {
          btn.style.background = '#f0f0f0';
          btn.style.boxShadow = 'none';
        }
      });
      
      // Notify about deletions
      if (onSketchDelete) {
        onSketchDelete({ type: 'graphic', geometry: null });
      }
    });
    
    sketchContainer.appendChild(clearButton);
    
    // Add the container to the view's UI
    if (view && view.container) {
      view.container.appendChild(sketchContainer);
    } else {
      // Fallback to body if view.container is not available
      document.body.appendChild(sketchContainer);
    }
    
    sketchRef.current = sketchContainer;
    
    return () => {
      // Clean up
      if (sketchRef.current) {
        sketchRef.current.remove();
      }
    };
  }, [view, position]);
  
  // Function to simulate sketch creation
  const simulateSketch = (type: string) => {
    // Create a timeout to simulate drawing completion
    setTimeout(() => {
      if (!active) return;
      
      console.log(`Completed ${type} sketch (simulated)`);
      
      // Create a simulated geometry based on the sketch type
      const simulatedGeometry = createSimulatedGeometry(type);
      
      // Create a simulated graphic
      const simulatedGraphic = {
        type: 'graphic',
        geometry: simulatedGeometry,
        attributes: {
          id: `sketch-${Date.now()}`,
          type: type
        }
      };
      
      // Call the appropriate callbacks
      if (onSketchComplete) {
        onSketchComplete(simulatedGeometry);
      }
      
      if (onSketchCreate) {
        onSketchCreate(simulatedGraphic);
      }
    }, 2000); // Simulate 2 seconds of drawing
    
    // Simulate updates while "drawing"
    let updateCount = 0;
    const updateInterval = setInterval(() => {
      if (!active || updateCount >= 4) {
        clearInterval(updateInterval);
        return;
      }
      
      updateCount++;
      
      if (onSketchUpdate) {
        // Create a simulated in-progress geometry
        const inProgressGeometry = createSimulatedGeometry(type, true, updateCount / 4);
        onSketchUpdate(inProgressGeometry);
      }
    }, 500);
  };
  
  // Helper function to create simulated geometries
  const createSimulatedGeometry = (type: string, inProgress: boolean = false, completionRatio: number = 1) => {
    // Generate random center point (simulated as if user clicked somewhere on the map)
    const center = {
      x: -120 + Math.random() * 10,
      y: 35 + Math.random() * 5,
      spatialReference: { wkid: 4326 }
    };
    
    // Base size for geometries
    const size = inProgress ? 0.02 * completionRatio : 0.02;
    
    switch (type) {
      case 'point':
        return {
          type: 'point',
          x: center.x,
          y: center.y,
          spatialReference: center.spatialReference
        };
        
      case 'polyline':
        return {
          type: 'polyline',
          paths: [
            [
              [center.x, center.y],
              [center.x + (inProgress ? size * completionRatio : size), center.y + 0.01],
              inProgress && completionRatio < 0.7 ? null : [center.x + size, center.y - 0.01]
            ]
          ],
          spatialReference: center.spatialReference
        };
        
      case 'polygon':
        return {
          type: 'polygon',
          rings: [
            [
              [center.x, center.y],
              [center.x + size, center.y],
              inProgress && completionRatio < 0.6 ? null : [center.x + size, center.y + size],
              inProgress && completionRatio < 0.9 ? null : [center.x, center.y + size],
              [center.x, center.y]
            ]
          ],
          spatialReference: center.spatialReference
        };
        
      case 'rectangle':
        return {
          type: 'polygon',
          rings: [
            [
              [center.x, center.y],
              [center.x + size, center.y],
              [center.x + size, center.y + size],
              [center.x, center.y + size],
              [center.x, center.y]
            ]
          ],
          spatialReference: center.spatialReference
        };
        
      case 'circle':
        // Simulate a circle using a polygon with many points
        const points = [];
        const radius = size;
        const sides = inProgress ? Math.floor(16 * completionRatio) : 16;
        
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);
          points.push([x, y]);
        }
        
        return {
          type: 'polygon',
          rings: [points],
          spatialReference: center.spatialReference
        };
        
      default:
        return null;
    }
  };
  
  return null;
};

export default ArcGISSketchSimplified;