import React from 'react';
import ModernLayout from '../components/layout/modern-layout';
import ParcelDocumentsPanel from '../components/documents/parcel-documents-panel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTitle } from '../hooks/use-title';

// Sample parcel data for demo
const sampleParcel = {
  APN: '12345678',
  address: '123 Main St, Kennewick, WA 99336',
  owner: 'John Doe',
  acreage: 2.5,
  landUseCode: 'R1',
  zoning: 'Residential',
  shape: { /* placeholder for GeoJSON */ },
  attributes: {
    taxExempt: false,
    inFloodZone: false,
    hasWaterRights: true
  }
};

// Sample documents for the demo
const mockDocuments = [
  {
    id: '1',
    name: 'Deed_12345678.pdf',
    type: 'DEED',
    status: 'approved',
    uploadDate: '2025-03-15T14:32:00',
    size: 1458000,
    uploadedBy: 'Alice Johnson',
    tags: ['property', 'transfer'],
    classification: {
      documentType: 'WARRANTY_DEED',
      confidence: 0.95
    }
  },
  {
    id: '2',
    name: 'Survey_2024_12345678.pdf',
    type: 'SURVEY',
    status: 'approved',
    uploadDate: '2025-01-10T09:15:00',
    size: 3245000,
    uploadedBy: 'Robert Smith',
    tags: ['boundary', 'official'],
    classification: {
      documentType: 'BOUNDARY_SURVEY',
      confidence: 0.92
    }
  },
  {
    id: '3',
    name: 'BuildingPermit_2025.pdf',
    type: 'PERMIT',
    status: 'pending',
    uploadDate: '2025-04-28T11:20:00',
    size: 842000,
    uploadedBy: 'John Doe',
    tags: ['construction', 'residential'],
    classification: {
      documentType: 'BUILDING_PERMIT',
      confidence: 0.88
    }
  },
  {
    id: '4',
    name: 'Variance_Application.pdf',
    type: 'APPLICATION',
    status: 'draft',
    uploadDate: '2025-05-02T16:45:00',
    size: 567000,
    uploadedBy: 'Maria Garcia',
    tags: ['zoning', 'variance'],
    classification: {
      documentType: 'VARIANCE_REQUEST',
      confidence: 0.75
    }
  },
  {
    id: '5',
    name: 'Easement_Agreement.pdf',
    type: 'AGREEMENT',
    status: 'rejected',
    uploadDate: '2025-02-18T10:30:00',
    size: 1124000,
    uploadedBy: 'David Wilson',
    tags: ['easement', 'utility'],
    classification: {
      documentType: 'EASEMENT',
      confidence: 0.9
    }
  }
];

/**
 * Demo page to display the Parcel Documents Panel with mock data
 * This allows viewing the document management functionality without needing login
 */
const DemoDocumentPanel: React.FC = () => {
  useTitle('Document Panel Demo | TerraFusion');

  // Mock API handlers for the document panel
  React.useEffect(() => {
    // Mock API response for document queries
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      // Mock the documents API endpoint
      if (typeof input === 'string' && input.includes('/api/documents/parcel')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => mockDocuments
            } as Response);
          }, 800); // Simulate network delay
        });
      }
      
      // Pass through all other requests
      return originalFetch(input, init);
    };
    
    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ModernLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Document Management Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parcel Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Parcel Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Parcel Number</h3>
                  <p>{sampleParcel.APN}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                  <p>{sampleParcel.address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
                  <p>{sampleParcel.owner}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Acreage</h3>
                  <p>{sampleParcel.acreage} acres</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Land Use & Zoning</h3>
                  <p>{sampleParcel.landUseCode} - {sampleParcel.zoning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Document Management Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Parcel Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ParcelDocumentsPanel parcel={sampleParcel} />
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 p-4 border rounded-md bg-muted/50">
          <h2 className="text-lg font-medium mb-2">About This Demo</h2>
          <p className="text-muted-foreground">
            This page demonstrates the document management functionality for the TerraFusion platform.
            Users can filter documents by status, search by name or type, view document details, and 
            (with appropriate permissions) upload or delete documents associated with a parcel.
          </p>
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-1">Demo Features:</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>Filter documents by status (draft, pending, approved, rejected)</li>
              <li>Search documents by name or type</li>
              <li>View document details and metadata</li>
              <li>Simulated document upload functionality</li>
              <li>Role-based access controls for document management</li>
            </ul>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default DemoDocumentPanel;