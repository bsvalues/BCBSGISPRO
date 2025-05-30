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
  
  // Check if the element has a displayName that matches Leaflet components
  if (typeof element.type === 'function') {
    const componentType = element.type as { displayName?: string; name?: string };
    if (
      (componentType.displayName && LEAFLET_DEPENDENT_COMPONENTS.includes(componentType.displayName)) ||
      (componentType.name && LEAFLET_DEPENDENT_COMPONENTS.includes(componentType.name))
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Recursively checks if any children in a React node tree require Leaflet context
 * 
 * This is a simplified, type-safe version that correctly handles different types of React children
 */
export function containsLeafletDependentComponents(children: React.ReactNode): boolean {
  // Handle null or undefined children
  if (children == null) {
    return false;
  }
  
  // Handle single React element
  if (React.isValidElement(children)) {
    if (isLeafletDependentElement(children)) {
      return true;
    }
    
    const childProps = children.props as { children?: React.ReactNode };
    if (childProps && childProps.children) {
      return containsLeafletDependentComponents(childProps.children);
    }
    
    return false;
  }
  
  // Handle arrays of children
  if (Array.isArray(children)) {
    return children.some(child => {
      return containsLeafletDependentComponents(child);
    });
  }
  
  // Non-renderable children (strings, numbers, etc.)
  return false;
}

/**
 * A simple function that explicitly checks for the presence of a ParcelOverlay component
 * This is more reliable than general detection for our specific use case
 */
export function containsParcelOverlay(children: React.ReactNode): boolean {
  if (children == null) {
    return false;
  }
  
  if (React.isValidElement(children)) {
    const elementType = children.type as { displayName?: string; name?: string };
    
    // Check if it's the ParcelOverlay component
    if (
      (typeof children.type === 'string' && children.type === 'ParcelOverlay') ||
      (typeof children.type === 'function' && 
        ((elementType.displayName === 'ParcelOverlay') || 
         (elementType.name === 'ParcelOverlay')))
    ) {
      return true;
    }
    
    // Recursively check children
    const childProps = children.props as { children?: React.ReactNode };
    if (childProps && childProps.children) {
      return containsParcelOverlay(childProps.children);
    }
  }
  
  // Handle arrays
  if (Array.isArray(children)) {
    return children.some(child => containsParcelOverlay(child));
  }
  
  return false;
}