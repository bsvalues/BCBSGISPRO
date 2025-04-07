import React, { useEffect, useRef } from 'react';

interface ArcGISControlsProps {
  view: __esri.MapView;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  enableZoom?: boolean;
  enableHome?: boolean;
  enableSearch?: boolean;
  enableBasemapGallery?: boolean;
  enableLayerList?: boolean;
  enableLegend?: boolean;
  enableMeasurement?: boolean;
  enablePrint?: boolean;
}

const ArcGISControls: React.FC<ArcGISControlsProps> = ({
  view,
  position = 'top-right',
  enableZoom = true,
  enableHome = true,
  enableSearch = true,
  enableBasemapGallery = false,
  enableLayerList = false,
  enableLegend = false,
  enableMeasurement = false,
  enablePrint = false
}) => {
  const controlsRef = useRef<{ destroy: () => void }[]>([]);
  const expand = useRef<any>(null);
  
  useEffect(() => {
    let modules: any[] = [];
    
    // Import all required modules
    Promise.all([
      import('@arcgis/core/widgets/Zoom'),
      import('@arcgis/core/widgets/Home'),
      import('@arcgis/core/widgets/Search'),
      import('@arcgis/core/widgets/BasemapGallery'),
      import('@arcgis/core/widgets/LayerList'),
      import('@arcgis/core/widgets/Legend'),
      import('@arcgis/core/widgets/Measurement'),
      import('@arcgis/core/widgets/Print'),
      import('@arcgis/core/widgets/Expand')
    ]).then(([
      { default: Zoom },
      { default: Home },
      { default: Search },
      { default: BasemapGallery },
      { default: LayerList },
      { default: Legend },
      { default: Measurement },
      { default: Print },
      { default: Expand }
    ]) => {
      // Store for cleanup
      const controls: any[] = [];
      
      // Add zoom widget
      if (enableZoom) {
        const zoom = new Zoom({ view });
        view.ui.add(zoom, { position });
        controls.push(zoom);
      }
      
      // Add home widget
      if (enableHome) {
        const home = new Home({ view });
        view.ui.add(home, { position });
        controls.push(home);
      }
      
      // Add search widget
      if (enableSearch) {
        const search = new Search({ view });
        view.ui.add(search, { position });
        controls.push(search);
      }
      
      // Create expandable widgets
      expand.current = new Expand({
        view,
        content: document.createElement('div'),
        expandIconClass: 'esri-icon-layers',
        expandTooltip: 'Advanced Tools',
        group: 'top-right'
      });
      
      if (enableBasemapGallery || enableLayerList || enableLegend || enableMeasurement || enablePrint) {
        view.ui.add(expand.current, position);
        controls.push(expand.current);
        
        const container = document.createElement('div');
        container.className = 'esri-widget esri-control-panel';
        expand.current.content = container;
      }
      
      // Add basemap gallery
      if (enableBasemapGallery) {
        const basemapGallery = new BasemapGallery({
          view,
          container: document.createElement('div')
        });
        const bgExpand = new Expand({
          view,
          content: basemapGallery,
          expandIconClass: 'esri-icon-basemap',
          expandTooltip: 'Basemap Gallery'
        });
        view.ui.add(bgExpand, position);
        controls.push(bgExpand);
      }
      
      // Add layer list
      if (enableLayerList) {
        const layerList = new LayerList({
          view,
          container: document.createElement('div'),
          listItemCreatedFunction: (event) => {
            const item = event.item;
            if (item.layer.type !== 'group') {
              item.panel = {
                content: 'legend',
                open: false
              };
            }
          }
        });
        const llExpand = new Expand({
          view,
          content: layerList,
          expandIconClass: 'esri-icon-layer-list',
          expandTooltip: 'Layer List'
        });
        view.ui.add(llExpand, position);
        controls.push(llExpand);
      }
      
      // Add legend
      if (enableLegend) {
        const legend = new Legend({
          view,
          container: document.createElement('div')
        });
        const legendExpand = new Expand({
          view,
          content: legend,
          expandIconClass: 'esri-icon-legend',
          expandTooltip: 'Legend'
        });
        view.ui.add(legendExpand, position);
        controls.push(legendExpand);
      }
      
      // Add measurement tools
      if (enableMeasurement) {
        const measurement = new Measurement({
          view,
          container: document.createElement('div')
        });
        const measureExpand = new Expand({
          view,
          content: measurement,
          expandIconClass: 'esri-icon-measure',
          expandTooltip: 'Measurement'
        });
        view.ui.add(measureExpand, position);
        controls.push(measureExpand);
      }
      
      // Add print capability
      if (enablePrint) {
        const print = new Print({
          view,
          container: document.createElement('div')
        });
        const printExpand = new Expand({
          view,
          content: print,
          expandIconClass: 'esri-icon-printer',
          expandTooltip: 'Print'
        });
        view.ui.add(printExpand, position);
        controls.push(printExpand);
      }
      
      controlsRef.current = controls;
    }).catch(error => {
      console.error('Error loading ArcGIS controls:', error);
    });
    
    // Cleanup function
    return () => {
      controlsRef.current.forEach(control => {
        if (control && typeof control.destroy === 'function') {
          view.ui.remove(control);
          control.destroy();
        }
      });
      controlsRef.current = [];
    };
  }, [
    view, 
    position, 
    enableZoom, 
    enableHome, 
    enableSearch, 
    enableBasemapGallery, 
    enableLayerList, 
    enableLegend,
    enableMeasurement,
    enablePrint
  ]);
  
  // This component doesn't render anything directly
  return null;
};

export default ArcGISControls;