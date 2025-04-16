import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { demoDocuments, DemoDocument } from '../data/demo-property-data';
import { formatDate, formatFileSize } from '../lib/utils';

const DemoDocumentClassification: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DemoDocument[]>(demoDocuments);
  const [selectedDocument, setSelectedDocument] = useState<DemoDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filter documents based on search query and active tab
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && doc.classificationStatus === 'pending';
    if (activeTab === 'classified') return matchesSearch && doc.classificationStatus === 'classified';
    if (activeTab === 'reviewed') return matchesSearch && doc.classificationStatus === 'reviewed';
    
    return false;
  });
  
  // Group documents by type for the summary view
  const documentTypes = demoDocuments.reduce((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Simulate document classification process
  const processDocument = (doc: DemoDocument) => {
    setIsProcessing(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const updatedDocuments = documents.map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            classificationStatus: 'classified' as 'classified',
            confidenceScore: Math.random() * 0.15 + 0.85, // Random score between 0.85 and 1.0
          };
        }
        return d;
      });
      
      setDocuments(updatedDocuments);
      setSelectedDocument(updatedDocuments.find(d => d.id === doc.id) || null);
      setIsProcessing(false);
    }, 1500);
  };
  
  // Review and approve a document classification
  const approveClassification = (doc: DemoDocument) => {
    const updatedDocuments = documents.map(d => {
      if (d.id === doc.id) {
        return {
          ...d,
          classificationStatus: 'reviewed' as 'reviewed',
          reviewedBy: user?.username,
        };
      }
      return d;
    });
    
    setDocuments(updatedDocuments);
    setSelectedDocument(updatedDocuments.find(d => d.id === doc.id) || null);
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please log in to access this page.</p>
          <Link href="/">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Document Classification</h1>
        <p className="text-muted-foreground">
          Automated document classification and management system
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Document List */}
        <div className="lg:col-span-2">
          <div className="bg-card shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex space-x-2">
                  <button 
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Documents
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'pending' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'classified' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                    onClick={() => setActiveTab('classified')}
                  >
                    Classified
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${activeTab === 'reviewed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                    onClick={() => setActiveTab('reviewed')}
                  >
                    Reviewed
                  </button>
                </div>
                <div className="w-full sm:w-auto">
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No documents found matching your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Parcel ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Upload Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDocuments.map((doc) => (
                      <tr 
                        key={doc.id} 
                        className={`hover:bg-muted/50 cursor-pointer ${selectedDocument?.id === doc.id ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{doc.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{doc.type}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{doc.parcelId}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${doc.classificationStatus === 'classified' ? 'bg-blue-100 text-blue-800' : 
                              doc.classificationStatus === 'reviewed' ? 'bg-green-100 text-green-800' : 
                              'bg-amber-100 text-amber-800'}`}
                          >
                            {doc.classificationStatus === 'classified' ? 'Classified' : 
                             doc.classificationStatus === 'reviewed' ? 'Reviewed' : 
                             'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{formatDate(doc.uploadDate)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel - Document Details or Summary */}
        <div>
          {selectedDocument ? (
            <div className="bg-card shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">{selectedDocument.name}</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  Close
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Document Type</p>
                    <p className="font-medium">{selectedDocument.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parcel ID</p>
                    <p className="font-medium">{selectedDocument.parcelId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">File Size</p>
                    <p className="font-medium">{formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upload Date</p>
                    <p className="font-medium">{formatDate(selectedDocument.uploadDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Uploaded By</p>
                    <p className="font-medium">{selectedDocument.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{selectedDocument.classificationStatus || 'Pending'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p>{selectedDocument.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDocument.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {selectedDocument.classificationStatus === 'classified' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Classification Results</p>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Confidence Score</span>
                        <span className="text-sm font-medium">
                          {(selectedDocument.confidenceScore || 0) * 100}%
                        </span>
                      </div>
                      <div className="w-full bg-primary/20 rounded-full h-2 mb-3">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(selectedDocument.confidenceScore || 0) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Document has been automatically classified as <strong>{selectedDocument.type}</strong>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-border">
                  {selectedDocument.classificationStatus === 'pending' && (
                    <Button 
                      onClick={() => processDocument(selectedDocument)}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : 'Process Document'}
                    </Button>
                  )}
                  
                  {selectedDocument.classificationStatus === 'classified' && (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => approveClassification(selectedDocument)}
                        className="w-full"
                      >
                        Approve Classification
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                      >
                        Adjust Classification
                      </Button>
                    </div>
                  )}
                  
                  {selectedDocument.classificationStatus === 'reviewed' && (
                    <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm">
                      <p>This document has been successfully classified and reviewed.</p>
                      {selectedDocument.reviewedBy && (
                        <p className="mt-1">Reviewed by: <strong>{selectedDocument.reviewedBy}</strong></p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Document Summary</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Total Documents</p>
                    <p className="text-2xl font-bold">{demoDocuments.length}</p>
                  </div>
                  <div className="bg-primary/5 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Pending</p>
                    <p className="text-2xl font-bold">
                      {demoDocuments.filter(d => d.classificationStatus === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Classified</p>
                    <p className="text-2xl font-bold">
                      {demoDocuments.filter(d => d.classificationStatus === 'classified').length}
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Reviewed</p>
                    <p className="text-2xl font-bold">
                      {demoDocuments.filter(d => d.classificationStatus === 'reviewed').length}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Document Types</h3>
                  <div className="space-y-2">
                    {Object.entries(documentTypes).map(([type, count]) => (
                      <div 
                        key={type}
                        className="flex justify-between items-center p-2 bg-muted rounded-md"
                      >
                        <span>{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <Button className="w-full">
                    Upload New Document
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoDocumentClassification;