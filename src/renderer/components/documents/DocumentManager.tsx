import React, { useState, useEffect, useCallback } from 'react';
import { DocumentType, classifyDocument, getDocumentTypeLabel, getDocumentTypeDescription } from '../../../../shared/document-types';
import './DocumentManager.css';

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  uploadDate: Date;
  classification: {
    type: DocumentType;
    confidence: number;
  };
  parcelId?: string | null;
}

interface DocumentManagerProps {
  onDocumentSelect?: (document: Document) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ onDocumentSelect }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<DocumentType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch documents on component mount (in a real app, this would call your API)
  useEffect(() => {
    // Simulate API call with mock data for demonstration
    setLoading(true);
    
    // This would be an API call in a real application
    setTimeout(() => {
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'deed-property-123.pdf',
          type: DocumentType.DEED,
          size: 1024 * 1024 * 2.1, // 2.1 MB
          uploadDate: new Date(2023, 5, 12),
          classification: classifyDocument('deed-property-123.pdf'),
          parcelId: '123'
        },
        {
          id: '2',
          name: 'survey-2023-04-15.pdf',
          type: DocumentType.SURVEY,
          size: 1024 * 1024 * 5.3, // 5.3 MB
          uploadDate: new Date(2023, 3, 15),
          classification: classifyDocument('survey-2023-04-15.pdf'),
          parcelId: '123'
        },
        {
          id: '3',
          name: 'tax-assessment-2023.pdf',
          type: DocumentType.TAX_ASSESSMENT,
          size: 1024 * 1024 * 1.2, // 1.2 MB
          uploadDate: new Date(2023, 0, 5),
          classification: classifyDocument('tax-assessment-2023.pdf'),
          parcelId: '456'
        },
        {
          id: '4',
          name: 'plat-woodlands-subdivision.pdf',
          type: DocumentType.PLAT_MAP,
          size: 1024 * 1024 * 8.7, // 8.7 MB
          uploadDate: new Date(2022, 11, 10),
          classification: classifyDocument('plat-woodlands-subdivision.pdf'),
          parcelId: '789'
        }
      ];
      
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle document selection
  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Create a new document
          const newDoc: Document = {
            id: `new-${Date.now()}`,
            name: file.name,
            type: classifyDocument(file.name).type,
            size: file.size,
            uploadDate: new Date(),
            classification: classifyDocument(file.name),
            parcelId: null
          };
          
          setDocuments(prev => [...prev, newDoc]);
          setIsUploading(false);
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  // Filter documents by type and search term
  const filteredDocuments = documents.filter(doc => {
    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div className="document-manager">
      <div className="document-manager-header">
        <h2>Document Management</h2>
        
        <div className="document-controls">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as DocumentType | 'ALL')}
              className="filter-select"
            >
              <option value="ALL">All Documents</option>
              {Object.values(DocumentType).map(type => (
                <option key={type} value={type}>{getDocumentTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          
          <div className="upload-section">
            <label className="upload-button">
              Upload Document
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.tif,.tiff"
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
        
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="progress-text">{uploadProgress}% Uploaded</div>
          </div>
        )}
      </div>
      
      <div className="document-list-container">
        {loading ? (
          <div className="loading-indicator">Loading documents...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <p>No documents found. Upload a document to get started.</p>
          </div>
        ) : (
          <table className="document-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Classification</th>
                <th>Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(doc => (
                <tr
                  key={doc.id}
                  className={selectedDocument?.id === doc.id ? 'selected-row' : ''}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <td>{doc.name}</td>
                  <td>{doc.type}</td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>{doc.uploadDate.toLocaleDateString()}</td>
                  <td>{doc.classification.type}</td>
                  <td>{(doc.classification.confidence * 100).toFixed(0)}%</td>
                  <td>
                    <button
                      className="action-button view-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentSelect(doc);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {selectedDocument && (
        <div className="document-detail">
          <h3>Document Details</h3>
          <div className="document-detail-content">
            <div className="document-detail-info">
              <p><strong>Name:</strong> {selectedDocument.name}</p>
              <p><strong>Type:</strong> {selectedDocument.type}</p>
              <p><strong>Size:</strong> {formatFileSize(selectedDocument.size)}</p>
              <p><strong>Upload Date:</strong> {selectedDocument.uploadDate.toLocaleDateString()}</p>
              <p><strong>Classification:</strong> {selectedDocument.classification.type} ({(selectedDocument.classification.confidence * 100).toFixed(0)}% confidence)</p>
              <p><strong>Description:</strong> {getDocumentTypeDescription(selectedDocument.classification.type)}</p>
            </div>
            <div className="document-detail-actions">
              <button className="action-button">Download</button>
              <button className="action-button">Edit</button>
              <button className="action-button delete-button">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;