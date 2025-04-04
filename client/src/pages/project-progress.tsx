import React from 'react';
import { ProjectTracker, ProjectFeature } from '@/components/project-tracker';

const projectFeatures: ProjectFeature[] = [
  {
    id: '1',
    name: 'Mapbox Integration',
    description: 'Implementation of Mapbox GL JS with secure token management and enhanced drawing tools.',
    status: 'completed',
    progress: 100
  },
  {
    id: '2',
    name: 'Legal Description Parser',
    description: 'Parser service for converting legal property descriptions to map elements with visualization.',
    status: 'completed',
    progress: 100
  },
  {
    id: '3',
    name: 'WebSocket Collaboration',
    description: 'Real-time collaborative editing with room-based messaging and reconnection logic.',
    status: 'completed',
    progress: 100
  },
  {
    id: '4',
    name: 'Document-Parcel Management',
    description: 'System for managing relationships between documents and parcels with type classification.',
    status: 'completed',
    progress: 100
  },
  {
    id: '5',
    name: 'Snap-to-Feature Tool',
    description: 'Precision drawing tool that snaps to nearby map features for accurate placement.',
    status: 'in-progress',
    progress: 75
  },
  {
    id: '6',
    name: 'Drawing Annotations',
    description: 'Tools for adding text annotations and metadata to drawn map features.',
    status: 'in-progress',
    progress: 60
  },
  {
    id: '7',
    name: 'Drawing History & Version Control',
    description: 'Track changes to map drawings with ability to view and restore previous versions.',
    status: 'in-progress',
    progress: 40
  },
  {
    id: '8',
    name: 'Measurement System',
    description: 'Advanced measurement tools for calculating distances, areas, and angles on maps.',
    status: 'planned',
    progress: 10
  },
  {
    id: '9',
    name: 'Document Classification AI',
    description: 'Machine learning system for automatic classification of uploaded documents.',
    status: 'planned',
    progress: 20
  },
  {
    id: '10',
    name: 'Layer Management',
    description: 'Custom opacity and visibility controls for different map layers.',
    status: 'planned',
    progress: 15
  },
  {
    id: '11',
    name: 'Workflow Automation',
    description: 'Customizable workflows for document processing and approval chains.',
    status: 'planned',
    progress: 5
  },
  {
    id: '12',
    name: 'Advanced Reports',
    description: 'Customizable report generation from parcel and document data.',
    status: 'planned',
    progress: 0
  }
];

export default function ProjectProgressPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Project Progress</h1>
      
      <ProjectTracker
        projectName="BentonGeoPro GIS Platform"
        projectDescription="A cutting-edge Geographic Information System (GIS) workflow solution for the Benton County Assessor's Office, delivering advanced geospatial data processing with intelligent document management and robust collaborative features."
        features={projectFeatures}
      />
    </div>
  );
}