import React, { useEffect, useState } from 'react';
import { loadModules } from '@esri/react-arcgis';

interface ControlsProps {
  view: __esri.MapView;
  enableZoom?: boolean;
  enableSearch?: boolean;
  enableBasemapGallery?: boolean;
  enableLegend?: boolean;
  enableLayerList?: boolean;
  enableMeasurement?: boolean;
  enableScaleBar?: boolean;
  enableHome?: boolean;
  enablePrint?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ArcGISControls: React.FC<ControlsProps> = ({
  view,
  enableZoom = true,
  enableSearch = false,
  enableBasemapGallery = false,
  enableLegend = false,
  enableLayerList = false,
  enableMeasurement = false,
  enableScaleBar = false,
  enableHome = true,
  enablePrint = false,
  position = 'top-left'
}) => {
  useEffect(() => {
    if (!view) return;

    const loadControls = async () => {
      try {
        // Load UI widgets
        const [
          Zoom,
          Search,
          BasemapGallery,
          Legend,
          LayerList,
          Measurement,
          ScaleBar,
          Home,
          Print,
          Expand
        ] = await loadModules([
          'esri/widgets/Zoom',
          'esri/widgets/Search',
          'esri/widgets/BasemapGallery',
          'esri/widgets/Legend',
          'esri/widgets/LayerList',
          'esri/widgets/Measurement',
          'esri/widgets/ScaleBar',
          'esri/widgets/Home',
          'esri/widgets/Print',
          'esri/widgets/Expand'
        ]);

        // Configure and add enabled widgets
        if (enableZoom) {
          const zoomWidget = new Zoom({ view });
          view.ui.add(zoomWidget, { position });
        }

        if (enableSearch) {
          const searchWidget = new Search({ view });
          view.ui.add(searchWidget, { position });
        }

        if (enableBasemapGallery) {
          const basemapGallery = new BasemapGallery({ view });
          const bgExpand = new Expand({
            view,
            content: basemapGallery,
            expandIconClass: 'esri-icon-basemap',
            expandTooltip: 'Basemap Gallery'
          });
          view.ui.add(bgExpand, position);
        }

        if (enableLegend) {
          const legend = new Legend({ view });
          const legendExpand = new Expand({
            view,
            content: legend,
            expandIconClass: 'esri-icon-legend',
            expandTooltip: 'Legend'
          });
          view.ui.add(legendExpand, position);
        }

        if (enableLayerList) {
          const layerList = new LayerList({ view });
          const layerListExpand = new Expand({
            view,
            content: layerList,
            expandIconClass: 'esri-icon-layers',
            expandTooltip: 'Layers'
          });
          view.ui.add(layerListExpand, position);
        }

        if (enableMeasurement) {
          const measurement = new Measurement({ view });
          const measurementExpand = new Expand({
            view,
            content: measurement,
            expandIconClass: 'esri-icon-measure',
            expandTooltip: 'Measurement'
          });
          view.ui.add(measurementExpand, position);
        }

        if (enableScaleBar) {
          const scaleBar = new ScaleBar({
            view,
            unit: 'dual'
          });
          view.ui.add(scaleBar, 'bottom-left');
        }

        if (enableHome) {
          const homeWidget = new Home({ view });
          view.ui.add(homeWidget, position);
        }

        if (enablePrint) {
          const printWidget = new Print({
            view,
            printServiceUrl: 'https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'
          });
          const printExpand = new Expand({
            view,
            content: printWidget,
            expandIconClass: 'esri-icon-printer',
            expandTooltip: 'Print'
          });
          view.ui.add(printExpand, position);
        }
      } catch (error) {
        console.error('Error loading controls:', error);
      }
    };

    loadControls();
  }, [view]);

  return null;
};

export default ArcGISControls;