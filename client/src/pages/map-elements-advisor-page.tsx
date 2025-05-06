import React from 'react';
import { MapElementsAdvisor } from '../components/maps/map-elements-advisor';

/**
 * Page for the Map Elements Advisor feature
 */
export default function MapElementsAdvisorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 border-b">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">BentonGeoPro</h1>
          <div className="text-sm text-gray-500">Map Elements Advisor</div>
        </div>
      </header>
      
      <main className="py-6">
        <MapElementsAdvisor />
      </main>
      
      <footer className="bg-white border-t py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Benton County Assessor's Office. All rights reserved.
        </div>
      </footer>
    </div>
  );
}