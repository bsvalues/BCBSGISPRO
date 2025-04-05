import React, { useState, useEffect } from 'react';
import { DocumentMetadata, DocumentStatus, DocumentClassification, getDocumentTypeLabel } from '../../../shared/document-types';
import './DocumentManager.css';

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dateUploaded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Mock data for initial development
  useEffect(() => {
    const mockDocuments: DocumentMetadata[] = [
      {
        id: '1',
        name: 'Parcel_10-12345_Deed.pdf',
        type: 'application/pdf',
        size: 2458092,
        dateUploaded: '2025-03-02T14:32:21Z',
        status: 'processed',
        classification: 'Deed',
        contentType: 'application/pdf',
        parcelId: '10-12345',
        creator: 'John Doe',
        lastModified: '2025-03-02T14:32:21Z',
        version: '1.0'
      },
      {
        id: '2',
        name: 'Survey_Map_Block_32.pdf',
        type: 'application/pdf',
        size: 5241896,
        dateUploaded: '2025-03-01T09:15:43Z',
        status: 'processed',
        classification: 'Survey',
        contentType: 'application/pdf',
        parcelId: '10-23456',
        creator: 'Sarah Johnson',
        lastModified: '2025-03-01T09:15:43Z',
        version: '1.0'
      },
      {
        id: '3',
        name: 'Tax_Record_2024_10-34567.pdf',
        type: 'application/pdf',
        size: 1245789,
        dateUploaded: '2025-02-28T16:22:10Z',
        status: 'processed',
        classification: 'TaxRecord',
        contentType: 'application/pdf',
        parcelId: '10-34567',
        creator: 'Robert Smith',
        lastModified: '2025-02-28T16:22:10Z',
        version: '1.0'
      },
      {
        id: '4',
        name: 'Easement_Agreement_River_View.pdf',
        type: 'application/pdf',
        size: 3456123,
        dateUploaded: '2025-02-25T11:05:32Z',
        status: 'processed',
        classification: 'Easement',
        contentType: 'application/pdf',
        parcelId: '10-45678',
        creator: 'Lisa Brown',
        lastModified: '2025-02-25T11:05:32Z',
        version: '1.0'
      },
      {
        id: '5',
        name: 'Plat_Map_Subdivision_Oakwood.pdf',
        type: 'application/pdf',
        size: 7845123,
        dateUploaded: '2025-02-20T13:45:09Z',
        status: 'processed',
        classification: 'Plat',
        contentType: 'application/pdf',
        creator: 'Michael Wilson',
        lastModified: '2025-02-20T13:45:09Z',
        version: '1.0'
      },
      {
        id: '6',
        name: 'Building_Permit_10-56789.pdf',
        type: 'application/pdf',
        size: 1845632,
        dateUploaded: '2025-02-18T10:12:45Z',
        status: 'processed',
        classification: 'Permit',
        contentType: 'application/pdf',
        parcelId: '10-56789',
        creator: 'Emily Davis',
        lastModified: '2025-02-18T10:12:45Z',
        version: '1.0'
      },
      {
        id: '7',
        name: 'Property_Photos_10-67890.zip',
        type: 'application/zip',
        size: 25841963,
        dateUploaded: '2025-02-15T15:30:22Z',
        status: 'processed',
        classification: 'Photos',
        contentType: 'application/zip',
        parcelId: '10-67890',
        creator: 'David Miller',
        lastModified: '2025-02-15T15:30:22Z',
        version: '1.0'
      },
      {
        id: '8',
        name: 'New_Document_Pending.pdf',
        type: 'application/pdf',
        size: 3214569,
        dateUploaded: '2025-04-05T09:10:15Z',
        status: 'pending',
        contentType: 'application/pdf',
        creator: 'Current User',
        lastModified: '2025-04-05T09:10:15Z',
        version: '1.0'
      }
    ];
    
    setDocuments(mockDocuments);
  }, []);
  
  // Filter and sort documents
  const filteredAndSortedDocuments = React.useMemo(() => {
    return documents
      .filter(doc => {
        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const searchMatch = 
            doc.name.toLowerCase().includes(query) || 
            (doc.parcelId && doc.parcelId.toLowerCase().includes(query)) ||
            (doc.classification && getDocumentTypeLabel(doc.classification).toLowerCase().includes(query));
          
          if (!searchMatch) return false;
        }
        
        // Apply type filter
        if (filterType !== 'all') {
          if (filterType === 'pending' && doc.status !== 'pending') return false;
          if (filterType === 'deed' && doc.classification !== 'Deed') return false;
          if (filterType === 'plat' && doc.classification !== 'Plat') return false;
          if (filterType === 'survey' && doc.classification !== 'Survey') return false;
          if (filterType === 'taxRecord' && doc.classification !== 'TaxRecord') return false;
          if (filterType === 'permit' && doc.classification !== 'Permit') return false;
          if (filterType === 'easement' && doc.classification !== 'Easement') return false;
          if (filterType === 'photos' && doc.classification !== 'Photos') return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by selected field
        if (sortBy === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        
        if (sortBy === 'type') {
          const typeA = a.classification ? getDocumentTypeLabel(a.classification) : '';
          const typeB = b.classification ? getDocumentTypeLabel(b.classification) : '';
          return sortDirection === 'asc'
            ? typeA.localeCompare(typeB)
            : typeB.localeCompare(typeA);
        }
        
        if (sortBy === 'size') {
          return sortDirection === 'asc'
            ? a.size - b.size
            : b.size - a.size;
        }
        
        if (sortBy === 'dateUploaded') {
          return sortDirection === 'asc'
            ? new Date(a.dateUploaded).getTime() - new Date(b.dateUploaded).getTime()
            : new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime();
        }
        
        return 0;
      });
  }, [documents, searchQuery, filterType, sortBy, sortDirection]);
  
  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'long' }) + ', ' + 
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  // Upload document (mock)
  const handleUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    
    const intervalId = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId);
          
          // Add a new pending document
          const newDoc: DocumentMetadata = {
            id: (documents.length + 1).toString(),
            name: 'Uploaded_Document_' + new Date().toISOString().substring(0, 10) + '.pdf',
            type: 'application/pdf',
            size: 2345678,
            dateUploaded: new Date().toISOString(),
            status: 'pending',
            contentType: 'application/pdf',
            creator: 'Current User',
            lastModified: new Date().toISOString(),
            version: '1.0'
          };
          
          setDocuments(prevDocs => [newDoc, ...prevDocs]);
          
          setTimeout(() => {
            setUploading(false);
          }, 500);
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Get document icon based on type
  const getDocumentIcon = (doc: DocumentMetadata) => {
    if (doc.classification === 'Deed') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
      );
    }
    
    if (doc.classification === 'Plat' || doc.classification === 'Survey') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
          <line x1="8" y1="2" x2="8" y2="18"></line>
          <line x1="16" y1="6" x2="16" y2="22"></line>
        </svg>
      );
    }
    
    if (doc.classification === 'TaxRecord') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      );
    }
    
    if (doc.classification === 'Permit') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="M9 14l2 2 4-4"></path>
        </svg>
      );
    }
    
    if (doc.classification === 'Easement') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 14h-3a2 2 0 0 1-2-2V8l-5 4 5 4v-4a2 2 0 0 1 2-2h3zM3 14h3a2 2 0 0 0 2-2V8l5 4-5 4v-4a2 2 0 0 0-2-2H3z"></path>
        </svg>
      );
    }
    
    if (doc.classification === 'Photos') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    );
  };
  
  // Get status icon based on document status
  const getStatusIcon = (status: DocumentStatus) => {
    if (status === 'processed') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    }
    
    if (status === 'pending') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
    }
    
    if (status === 'error') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
    
    return null;
  };
  
  // Preview document
  const handleDocumentClick = (doc: DocumentMetadata) => {
    setSelectedDocument(doc);
  };
  
  // Close preview
  const closePreview = () => {
    setSelectedDocument(null);
  };
  
  return (
    <div className="document-manager">
      <div className="document-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <div className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search documents by name, parcel ID, or type..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          
          <div className="filter-sort-controls">
            <div className="filter-control">
              <label htmlFor="filter-type">Filter:</label>
              <select 
                id="filter-type" 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Documents</option>
                <option value="pending">Pending Documents</option>
                <option value="deed">Deeds</option>
                <option value="plat">Plat Maps</option>
                <option value="survey">Surveys</option>
                <option value="taxRecord">Tax Records</option>
                <option value="permit">Permits</option>
                <option value="easement">Easements</option>
                <option value="photos">Photos</option>
              </select>
            </div>
            
            <div className="sort-control">
              <label htmlFor="sort-by">Sort By:</label>
              <select 
                id="sort-by" 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dateUploaded">Date Uploaded</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="size">Size</option>
              </select>
              <button 
                className="sort-direction" 
                onClick={toggleSortDirection}
                aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
              >
                {sortDirection === 'asc' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 11 12 6 7 11"></polyline>
                    <polyline points="17 18 12 13 7 18"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="7 13 12 18 17 13"></polyline>
                    <polyline points="7 6 12 11 17 6"></polyline>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <button className="upload-button" onClick={handleUpload}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload Document
        </button>
      </div>
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-label">
            <span>Uploading document...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}
      
      <div className="documents-list">
        <div className="list-header">
          <div>Name</div>
          <div>Type</div>
          <div>Size</div>
          <div>Parcel ID</div>
          <div>Date</div>
          <div className="header-status">Status</div>
          <div className="header-actions">Actions</div>
        </div>
        
        <div className="list-body">
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="no-documents">
              {searchQuery ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                  <p>No documents matching your search criteria.</p>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <p>No documents available. Upload a document to get started.</p>
                </>
              )}
            </div>
          ) : (
            filteredAndSortedDocuments.map(doc => (
              <div 
                key={doc.id} 
                className={`document-item ${doc.status === 'pending' ? 'pending' : ''}`}
                onClick={() => handleDocumentClick(doc)}
              >
                <div className="document-name">
                  <div className="document-icon">
                    {getDocumentIcon(doc)}
                  </div>
                  <span>{doc.name}</span>
                </div>
                
                <div className="document-type">
                  {doc.classification ? getDocumentTypeLabel(doc.classification) : 'Unclassified'}
                </div>
                
                <div className="document-size">
                  {formatFileSize(doc.size)}
                </div>
                
                <div className="document-parcel">
                  {doc.parcelId || '-'}
                </div>
                
                <div className="document-date">
                  {formatDate(doc.dateUploaded)}
                </div>
                
                <div className="document-status">
                  <div className={`status ${doc.status}`}>
                    {getStatusIcon(doc.status)}
                    <span>{doc.status === 'processed' ? 'Processed' : doc.status === 'pending' ? 'Pending' : 'Error'}</span>
                  </div>
                </div>
                
                <div className="document-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="action-button view" title="View document">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  
                  <button className="action-button download" title="Download document">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                  
                  <button className="action-button edit" title="Edit document">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {selectedDocument && (
        <div className="document-preview-overlay" onClick={closePreview}>
          <div className="document-preview" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h2>{selectedDocument.name}</h2>
              <button className="close-preview" onClick={closePreview}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="preview-content">
              <div className="document-thumbnail">
                {selectedDocument.classification === 'Photos' ? (
                  <img src="/assets/example-photo.jpg" alt="Document preview" />
                ) : (
                  <div className="placeholder-thumbnail">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Preview not available. Click download to view the document.</span>
                  </div>
                )}
              </div>
              
              <div className="document-details">
                <div className="detail-item">
                  <div className="detail-label">Document Type</div>
                  <div className="detail-value">
                    {selectedDocument.classification 
                      ? getDocumentTypeLabel(selectedDocument.classification) 
                      : 'Unclassified'}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">File Type</div>
                  <div className="detail-value">{selectedDocument.contentType}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Size</div>
                  <div className="detail-value">{formatFileSize(selectedDocument.size)}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Uploaded</div>
                  <div className="detail-value">{formatDate(selectedDocument.dateUploaded)}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Parcel ID</div>
                  <div className="detail-value">{selectedDocument.parcelId || 'Not assigned'}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value capitalize">
                    {selectedDocument.status === 'processed' ? 'Processed' : 
                     selectedDocument.status === 'pending' ? 'Pending' : 'Error'}
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Creator</div>
                  <div className="detail-value">{selectedDocument.creator || 'Unknown'}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Version</div>
                  <div className="detail-value">{selectedDocument.version || '1.0'}</div>
                </div>
                
                <div className="preview-actions">
                  <button className="preview-action-button download">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download Document
                  </button>
                  
                  <button className="preview-action-button edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Metadata
                  </button>
                  
                  {!selectedDocument.parcelId && (
                    <button className="preview-action-button assign">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                        <line x1="8" y1="2" x2="8" y2="18"></line>
                        <line x1="16" y1="6" x2="16" y2="22"></line>
                      </svg>
                      Assign to Parcel
                    </button>
                  )}
                  
                  <button className="preview-action-button delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;