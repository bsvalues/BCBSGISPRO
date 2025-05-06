import React from 'react';
import { MapElementsAdvisor } from '../components/maps/map-elements-advisor';
import ModernLayout from '../components/layout/modern-layout';

/**
 * Page for the Map Elements Advisor feature
 */
export default function MapElementsAdvisorPage() {
  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Map Elements Advisor</h1>
        <p className="text-gray-600 mb-8">
          Get AI-powered recommendations for your maps based on cartographic best practices.
          Our system analyzes your map description and provides guidance on the 33 essential map elements.
        </p>
        <MapElementsAdvisor />
      </div>
    </ModernLayout>
  );
}