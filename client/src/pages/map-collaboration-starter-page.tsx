import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CollaborationMapStarter } from '@/components/maps/collaborative/collaboration-map-starter';

/**
 * Map Collaboration Starter Page
 * 
 * This page allows users to start or join a collaborative map session.
 */
export function MapCollaborationStarterPage() {
  return (
    <div className="h-[calc(100vh-12rem)]">
      <Helmet>
        <title>Map Collaboration Starter - BentonGeoPro</title>
      </Helmet>
      
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Map Collaboration Starter</h1>
        <p className="text-muted-foreground">
          Start or join a collaborative map session with other users
        </p>
      </div>
      
      <div className="bg-card rounded-lg shadow-md overflow-hidden h-[calc(100%-4rem)]">
        <CollaborationMapStarter />
      </div>
    </div>
  );
}

export default MapCollaborationStarterPage;