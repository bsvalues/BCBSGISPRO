import React from 'react';

// List of components or component names that require Leaflet context
const LEAFLET_DEPENDENT_COMPONENTS = [
  'ParcelOverlay',
  'GeoJSON',
  'Marker',
  'Popup',
  'Tooltip',
  'Polyline',
  'Polygon',
  'Rectangle',
  'Circle',
  'CircleMarker',
];

/**
 * Checks if a React element's type (component) requires Leaflet context
 */
function isLeafletDependentElement(element: React.ReactElement): boolean {
  // Check if the element's type is a string and matches any of the known Leaflet component names
  if (typeof element.type === 'string' && LEAFLET_DEPENDENT_COMPONENTS.includes(element.type)) {
    return true;
  }
  
  // Check if the element has a displayName or name that matches Leaflet components
  if (
    typeof element.type === 'function' &&
    ((element.type as any).displayName && LEAFLET_DEPENDENT_COMPONENTS.includes((element.type as any).displayName)) ||
    ((element.type as any).name && LEAFLET_DEPENDENT_COMPONENTS.includes((element.type as any).name))
  ) {
    return true;
  }
  
  return false;
}

/**
 * Recursively checks if any children in a React node tree require Leaflet context
 */
export function containsLeafletDependentComponents(children: React.ReactNode): boolean {
  // Base case: no children
  if (!children) {
    return false;
  }
  
  // Handle single element
  if (React.isValidElement(children)) {
    // Check if the element itself is Leaflet-dependent
    if (isLeafletDependentElement(children)) {
      return true;
    }
    
    // Recursively check its children
    return containsLeafletDependentComponents(children.props.children);
  }
  
  // Handle array of children
  if (Array.isArray(children)) {
    return children.some(child => {
      if (React.isValidElement(child)) {
        // Check if this child is Leaflet-dependent
        if (isLeafletDependentElement(child)) {
          return true;
        }
        
        // Recursively check its children
        return containsLeafletDependentComponents(child.props.children);
      }
      return false;
    });
  }
  
  return false;
}

/**
 * Wraps children in a detector to find components that need Leaflet context
 * This is useful when you need to make this determination at runtime
 */
export function useLeafletDependencyDetector(children: React.ReactNode): boolean {
  return containsLeafletDependentComponents(children);
}