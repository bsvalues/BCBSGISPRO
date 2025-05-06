import React from 'react';
import { MapElementsAdvisor } from '@/components/maps/map-elements-advisor';
import { PageHeader } from '@/components/ui/page-header';
import { Brain, Map } from 'lucide-react';

export default function MapElementsAdvisorPage() {
  return (
    <div className="container py-6 space-y-6 max-w-6xl">
      <PageHeader
        title="Map Elements Advisor"
        description="AI-powered recommendations for creating professional maps based on cartographic best practices"
        icon={<Brain className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 gap-6">
        <MapElementsAdvisor />
      </div>
    </div>
  );
}