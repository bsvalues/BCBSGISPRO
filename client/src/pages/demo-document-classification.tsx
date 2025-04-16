import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { demoProperties } from '../data/demo-property-data';

// Demo document types
const DOCUMENT_TYPES = [
  'Deed',
  'Tax Statement',
  'Survey',
  'Building Permit',
  'Property Transfer',
  'Title Insurance',
  'Zoning Certificate',
  'Environmental Report'
];

// Demo document interface
interface DemoDocument {
  id: string;
  name: string;
  type: string;
  parcelId: string | null;
  uploadDate: string;
  confidence: number;
  size: number;
  status: 'processing' | 'classified' | 'verified' | 'error';
}

// Generate some demo documents
const generateDemoDocuments = (): DemoDocument[] => {
  const documents: DemoDocument[] = [];
  
  // Create documents for some of the demo properties
  for (let i = 0; i < demoProperties.length; i++) {
    const property = demoProperties[i];
    
    if (property.documents) {
      property.documents.forEach((doc, index) => {
        const docType = DOCUMENT_TYPES.find(type => doc.toLowerCase().includes(type.toLowerCase())) || DOCUMENT_TYPES[0];
        const confidence = Math.random() * 0.3 + 0.7; // Random confidence between 70% and 100%
        
        documents.push({
          id: `doc-${i}-${index}`,
          name: doc,
          type: docType,
          parcelId: property.parcelId,
          uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within last 30 days
          confidence: confidence,
          size: Math.floor(Math.random() * 5000000) + 500000, // Random size between 500KB and 5MB
          status: Math.random() > 0.2 ? 'classified' : (Math.random() > 0.5 ? 'verified' : 'processing')
        });
      });
    }
  }
  
  return documents.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
};

const demoDocuments = generateDemoDocuments();

// Document classification demo component
const DemoDocumentClassification: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DemoDocument | null>(null);
  
  // Filter documents based on search and type filter
  const filteredDocuments = demoDocuments.filter(doc => {
    const matchesSearch = 
      searchTerm === '' || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.parcelId && doc.parcelId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === null || doc.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Handle document click
  const handleDocumentClick = (doc: DemoDocument) => {
    setSelectedDocument(doc);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-primary">BentonGeoPro</h1>
            <nav className="ml-10 flex space-x-4">
              <Link href="/dashboard">
                <span className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  Dashboard
                </span>
              </Link>
              <Link href="/map">
                <span className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  Map Viewer
                </span>
              </Link>
              <Link href="/documents">
                <span className="px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary cursor-pointer">
                  Documents
                </span>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-muted-foreground">{user.role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Document List Sidebar */}
        <div className="w-96 border-r bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Documents</h2>
              <button className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground">
                Upload
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search documents or parcels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
              />
            </div>
            
            {/* Type filter */}
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                className={`px-2 py-1 text-xs rounded-md ${
                  filterType === null ? 'bg-primary text-primary-foreground' : 'bg-accent'
                }`}
                onClick={() => setFilterType(null)}
              >
                All
              </button>
              
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type}
                  className={`px-2 py-1 text-xs rounded-md ${
                    filterType === type ? 'bg-primary text-primary-foreground' : 'bg-accent'
                  }`}
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          {/* Document List */}
          <div className="overflow-y-auto max-h-[calc(100vh-225px)]">
            {filteredDocuments.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No documents found matching your criteria
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 border-b cursor-pointer hover:bg-accent/10 ${
                    selectedDocument?.id === doc.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleDocumentClick(doc)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm">{doc.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                      doc.status === 'classified' ? 'bg-blue-100 text-blue-800' :
                      doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-1">
                    Type: {doc.type}
                  </div>
                  
                  {doc.parcelId && (
                    <div className="text-xs text-muted-foreground mb-1">
                      Parcel: {doc.parcelId}
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{doc.uploadDate}</span>
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Document Preview */}
        <div className="flex-1 bg-background p-6">
          {selectedDocument ? (
            <div>
              <div className="bg-card shadow-lg rounded-lg overflow-hidden">
                <div className="bg-primary/5 p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold">{selectedDocument.name}</h3>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs rounded-md bg-accent">Download</button>
                    <button className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground">Edit Metadata</button>
                  </div>
                </div>
                
                <div className="p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Document Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{selectedDocument.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="capitalize">{selectedDocument.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Upload Date:</span>
                          <span>{selectedDocument.uploadDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">File Size:</span>
                          <span>{formatFileSize(selectedDocument.size)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Classification</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span>{(selectedDocument.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Parcel ID:</span>
                          <span>{selectedDocument.parcelId || 'Not detected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Property:</span>
                          <span>
                            {selectedDocument.parcelId 
                              ? demoProperties.find(p => p.parcelId === selectedDocument.parcelId)?.address.split(',')[0] || 'Unknown'
                              : 'Not linked'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Document Preview</h4>
                    <div className="border rounded-md bg-accent/5 h-72 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                          Document preview would appear here in the actual application
                        </p>
                        <p className="text-xs text-muted-foreground">
                          File: {selectedDocument.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Extracted Information</h4>
                    <div className="bg-accent/5 border rounded-md p-4 text-sm">
                      <p className="mb-2">
                        AI has extracted the following information from this document:
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="text-muted-foreground">Document Type:</span> {selectedDocument.type}
                        </div>
                        {selectedDocument.parcelId && (
                          <div>
                            <span className="text-muted-foreground">Parcel Number:</span> {selectedDocument.parcelId}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Date of Document:</span> {selectedDocument.uploadDate}
                        </div>
                        {selectedDocument.type === 'Deed' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Property Owner:</span> {
                                demoProperties.find(p => p.parcelId === selectedDocument.parcelId)?.owner || 'Unknown'
                              }
                            </div>
                            <div>
                              <span className="text-muted-foreground">Recorded Date:</span> {selectedDocument.uploadDate}
                            </div>
                          </>
                        )}
                        {selectedDocument.type === 'Building Permit' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Permit Number:</span> BP-{Math.floor(Math.random() * 900000) + 100000}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Issue Date:</span> {selectedDocument.uploadDate}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                <p className="text-muted-foreground">
                  Select a document from the list to view its details and classification
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoDocumentClassification;