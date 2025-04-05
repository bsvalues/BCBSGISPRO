import React, { useState, useEffect } from 'react';
import { DocumentType, DocumentStatus, DocumentMetadata, DocumentFormat, getDocumentTypeLabel, documentTypeToCategory, DocumentCategory } from '../../../shared/document-types';
import './DocumentManager.css';

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof DocumentMetadata>('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock documents for development
  useEffect(() => {
    const mockDocuments: DocumentMetadata[] = [
      {
        id: '1',
        title: 'Oak Hills Subdivision Plat',
        documentType: DocumentType.PLAT,
        format: DocumentFormat.PDF,
        status: DocumentStatus.APPROVED,
        fileSize: 2456238,
        uploadDate: new Date('2023-10-15'),
        lastModified: new Date('2023-10-16'),
        parcelId: '12345',
        createdBy: 'jsmith',
        isLatestVersion: true,
        path: '/documents/plat_oak_hills.pdf',
        tags: ['oak hills', 'subdivision', 'plat']
      },
      {
        id: '2',
        title: 'Boundary Adjustment Survey - 234 Main St',
        documentType: DocumentType.BOUNDARY_ADJUSTMENT,
        format: DocumentFormat.PDF,
        status: DocumentStatus.PENDING_REVIEW,
        fileSize: 1245678,
        uploadDate: new Date('2023-10-18'),
        lastModified: new Date('2023-10-18'),
        parcelId: '23456',
        createdBy: 'mjones',
        isLatestVersion: true,
        path: '/documents/boundary_adjustment_234_main.pdf'
      },
      {
        id: '3',
        title: 'Building Permit - 567 Oak Ln',
        documentType: DocumentType.BUILDING_PERMIT,
        format: DocumentFormat.PDF,
        status: DocumentStatus.APPROVED,
        fileSize: 3421789,
        uploadDate: new Date('2023-10-10'),
        lastModified: new Date('2023-10-12'),
        parcelId: '34567',
        workflowId: 'BLD-2023-567',
        createdBy: 'tjohnson',
        isLatestVersion: true,
        path: '/documents/building_permit_567_oak.pdf'
      },
      {
        id: '4',
        title: 'Riverside Property Deed',
        documentType: DocumentType.DEED,
        format: DocumentFormat.PDF,
        status: DocumentStatus.APPROVED,
        fileSize: 986543,
        uploadDate: new Date('2023-09-28'),
        lastModified: new Date('2023-09-28'),
        parcelId: '45678',
        createdBy: 'jwilliams',
        isLatestVersion: true,
        path: '/documents/riverside_deed.pdf'
      },
      {
        id: '5',
        title: 'Tax Assessment - 890 Maple Dr',
        documentType: DocumentType.ASSESSMENT,
        format: DocumentFormat.PDF,
        status: DocumentStatus.APPROVED,
        fileSize: 1567890,
        uploadDate: new Date('2023-10-05'),
        lastModified: new Date('2023-10-05'),
        parcelId: '56789',
        createdBy: 'sdavis',
        isLatestVersion: true,
        path: '/documents/tax_assessment_890_maple.pdf'
      },
      {
        id: '6',
        title: 'Zoning Variance Application - 123 Pine St',
        documentType: DocumentType.VARIANCE_APPLICATION,
        format: DocumentFormat.PDF,
        status: DocumentStatus.PENDING_REVIEW,
        fileSize: 2345678,
        uploadDate: new Date('2023-10-20'),
        lastModified: new Date('2023-10-20'),
        parcelId: '67890',
        workflowId: 'ZVA-2023-123',
        createdBy: 'bbrown',
        isLatestVersion: true,
        path: '/documents/variance_123_pine.pdf'
      },
      {
        id: '7',
        title: 'Aerial Photo - Downtown District 2023',
        documentType: DocumentType.AERIAL_PHOTO,
        format: DocumentFormat.JPEG,
        status: DocumentStatus.APPROVED,
        fileSize: 15789456,
        uploadDate: new Date('2023-09-15'),
        lastModified: new Date('2023-09-15'),
        createdBy: 'admin',
        isLatestVersion: true,
        path: '/documents/aerial_downtown_2023.jpg'
      }
    ];

    setDocuments(mockDocuments);
  }, []);

  // Filter documents based on category and search query
  const filteredDocuments = documents.filter(doc => {
    // Filter by category
    if (filterCategory !== 'ALL' && documentTypeToCategory[doc.documentType] !== filterCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(query) ||
        getDocumentTypeLabel(doc.documentType).toLowerCase().includes(query) ||
        doc.parcelId?.toLowerCase().includes(query) ||
        doc.workflowId?.toLowerCase().includes(query) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    return true;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    
    if (fieldA === undefined || fieldB === undefined) {
      return 0;
    }
    
    let comparison = 0;
    if (fieldA < fieldB) {
      comparison = -1;
    } else if (fieldA > fieldB) {
      comparison = 1;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle document selection
  const handleSelectDocument = (document: DocumentMetadata) => {
    setSelectedDocument(document);
  };

  // Toggle sort direction or change sort field
  const handleSort = (field: keyof DocumentMetadata) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle file upload - mocked for development
  const handleUpload = () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      return;
    }
    
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setIsUploadModalOpen(false);
        setUploadFiles(null);
        setUploadProgress(0);
        
        // Add mock uploaded document
        const file = uploadFiles[0];
        
        // Create new document
        const newDoc: DocumentMetadata = {
          id: `${documents.length + 1}`,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          documentType: DocumentType.UNKNOWN, // Would be classified by backend
          format: getFormatFromFileName(file.name),
          status: DocumentStatus.PENDING_REVIEW,
          fileSize: file.size,
          uploadDate: new Date(),
          lastModified: new Date(),
          createdBy: 'current_user',
          isLatestVersion: true,
          path: `/documents/${file.name}`
        };
        
        setDocuments([...documents, newDoc]);
      }
    }, 200);
  };

  // Helper to determine document format from file name
  const getFormatFromFileName = (fileName: string): DocumentFormat => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return DocumentFormat.PDF;
      case 'doc':
        return DocumentFormat.DOC;
      case 'docx':
        return DocumentFormat.DOCX;
      case 'xls':
        return DocumentFormat.XLS;
      case 'xlsx':
        return DocumentFormat.XLSX;
      case 'jpg':
      case 'jpeg':
        return DocumentFormat.JPEG;
      case 'png':
        return DocumentFormat.PNG;
      case 'tif':
      case 'tiff':
        return DocumentFormat.TIFF;
      case 'dwg':
        return DocumentFormat.DWG;
      case 'dxf':
        return DocumentFormat.DXF;
      case 'shp':
        return DocumentFormat.SHP;
      case 'kml':
        return DocumentFormat.KML;
      case 'geojson':
        return DocumentFormat.GEOJSON;
      default:
        return DocumentFormat.OTHER;
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class based on document status
  const getStatusBadgeClass = (status: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'status-badge approved';
      case DocumentStatus.PENDING_REVIEW:
        return 'status-badge pending';
      case DocumentStatus.REVIEWED:
        return 'status-badge reviewed';
      case DocumentStatus.REJECTED:
        return 'status-badge rejected';
      case DocumentStatus.DRAFT:
        return 'status-badge draft';
      case DocumentStatus.ARCHIVED:
        return 'status-badge archived';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="document-manager">
      <header className="document-manager-header">
        <h2>Document Manager</h2>
        <div className="document-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | 'ALL')}
            className="category-filter"
          >
            <option value="ALL">All Categories</option>
            {Object.values(DocumentCategory).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button 
            className="upload-button"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload
          </button>
        </div>
      </header>

      <div className="document-table-container">
        <table className="document-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} className={sortField === 'title' ? `sorted-${sortDirection}` : ''}>
                Title
                {sortField === 'title' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('documentType')} className={sortField === 'documentType' ? `sorted-${sortDirection}` : ''}>
                Type
                {sortField === 'documentType' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('status')} className={sortField === 'status' ? `sorted-${sortDirection}` : ''}>
                Status
                {sortField === 'status' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('uploadDate')} className={sortField === 'uploadDate' ? `sorted-${sortDirection}` : ''}>
                Upload Date
                {sortField === 'uploadDate' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('fileSize')} className={sortField === 'fileSize' ? `sorted-${sortDirection}` : ''}>
                Size
                {sortField === 'fileSize' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Parcel ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-documents">
                  <div className="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <p>No documents found</p>
                    {searchQuery && (
                      <button className="clear-search" onClick={() => setSearchQuery('')}>
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedDocuments.map((doc) => (
                <tr 
                  key={doc.id} 
                  onClick={() => handleSelectDocument(doc)}
                  className={selectedDocument?.id === doc.id ? 'selected' : ''}
                >
                  <td className="document-title">{doc.title}</td>
                  <td>{getDocumentTypeLabel(doc.documentType)}</td>
                  <td>
                    <span className={getStatusBadgeClass(doc.status)}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(doc.uploadDate)}</td>
                  <td>{formatFileSize(doc.fileSize)}</td>
                  <td>{doc.parcelId || '-'}</td>
                  <td className="actions">
                    <button className="action-button" title="View">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button className="action-button" title="Download">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    <button className="action-button" title="Properties">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDocument && (
        <div className="document-details">
          <div className="details-header">
            <h3>Document Details</h3>
            <button 
              className="close-details"
              onClick={() => setSelectedDocument(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Title:</span>
              <span className="detail-value">{selectedDocument.title}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Document Type:</span>
              <span className="detail-value">{getDocumentTypeLabel(selectedDocument.documentType)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Format:</span>
              <span className="detail-value">{selectedDocument.format.toUpperCase()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`detail-value ${getStatusBadgeClass(selectedDocument.status)}`}>
                {selectedDocument.status.replace('_', ' ')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Size:</span>
              <span className="detail-value">{formatFileSize(selectedDocument.fileSize)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Upload Date:</span>
              <span className="detail-value">{formatDate(selectedDocument.uploadDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Modified:</span>
              <span className="detail-value">{formatDate(selectedDocument.lastModified)}</span>
            </div>
            {selectedDocument.parcelId && (
              <div className="detail-row">
                <span className="detail-label">Parcel ID:</span>
                <span className="detail-value">{selectedDocument.parcelId}</span>
              </div>
            )}
            {selectedDocument.workflowId && (
              <div className="detail-row">
                <span className="detail-label">Workflow:</span>
                <span className="detail-value">{selectedDocument.workflowId}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Uploaded By:</span>
              <span className="detail-value">{selectedDocument.createdBy}</span>
            </div>
            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Tags:</span>
                <div className="detail-tags">
                  {selectedDocument.tags.map((tag, index) => (
                    <span key={index} className="document-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="detail-actions">
              <button className="detail-action-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
              </button>
              <button className="detail-action-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button className="detail-action-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>Upload Documents</h3>
              <button 
                className="close-modal"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFiles(null);
                  setUploadProgress(0);
                }}
                disabled={isUploading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-content">
              {isUploading ? (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{uploadProgress}% Uploaded</span>
                </div>
              ) : (
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={(e) => setUploadFiles(e.target.files)}
                    multiple
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Drag files here or click to select</span>
                  </label>
                  {uploadFiles && uploadFiles.length > 0 && (
                    <div className="selected-files">
                      <h4>Selected Files:</h4>
                      <ul className="file-list">
                        {Array.from(uploadFiles).map((file, index) => (
                          <li key={index} className="file-item">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">({formatFileSize(file.size)})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFiles(null);
                  setUploadProgress(0);
                }}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                className="upload-confirm-button"
                onClick={handleUpload}
                disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;