import React, { useState, useEffect } from 'react';

// Document type definition
interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: number;
  parcelId?: string;
}

/**
 * Component for managing documents (upload, view, search)
 */
const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | undefined>();
  
  // Load documents on component mount
  useEffect(() => {
    setLoading(true);
    
    // In a real implementation, this would fetch from the backend
    fetch(`/api/documents${selectedParcelId ? `?parcelId=${selectedParcelId}` : ''}`)
      .then(response => response.json())
      .then(data => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading documents:', error);
        setLoading(false);
      });
  }, [selectedParcelId]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newFileName) {
        setNewFileName(file.name);
      }
    }
  };
  
  // Handle document upload
  const handleUpload = () => {
    if (!selectedFile || !newFileName) return;
    
    setUploadStatus('Uploading...');
    
    // Prepare file classification (would be done on server in real implementation)
    classifyDocument(newFileName)
      .then(classification => {
        // In a real implementation, send the file to the server
        // Mock implementation for now
        const newDoc: Document = {
          id: String(Date.now()),
          name: newFileName,
          type: classification.type,
          uploadDate: new Date().toISOString().split('T')[0],
          size: selectedFile.size,
          parcelId: selectedParcelId
        };
        
        // In a real implementation this would be a POST request
        // Mock the API instead
        setDocuments(prev => [newDoc, ...prev]);
        
        // Reset form
        setSelectedFile(null);
        setNewFileName('');
        setUploadStatus(`Successfully uploaded ${newFileName} (classified as: ${classification.type})`);
        
        setTimeout(() => {
          setUploadStatus('');
        }, 3000);
      })
      .catch(error => {
        setUploadStatus(`Error uploading file: ${error.message}`);
      });
  };
  
  // Mock document classification (would be done on server in real implementation)
  const classifyDocument = (filename: string): Promise<{ type: string; confidence: number }> => {
    return new Promise((resolve) => {
      // In a real implementation, send to server for ML-based classification
      fetch('/api/classify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      })
        .then(response => response.json())
        .then(data => {
          resolve({
            type: data.type,
            confidence: data.confidence
          });
        })
        .catch(() => {
          // Fallback classification logic if server fails
          let type = 'Unknown';
          
          if (filename.toLowerCase().includes('deed')) {
            type = 'Deed';
          } else if (filename.toLowerCase().includes('survey')) {
            type = 'Survey';
          } else if (filename.toLowerCase().includes('tax')) {
            type = 'Tax Assessment';
          } else if (filename.toLowerCase().includes('plat') || filename.toLowerCase().includes('map')) {
            type = 'Plat Map';
          }
          
          resolve({ type, confidence: 0.7 });
        });
    });
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle document view/download
  const handleViewDocument = (doc: Document) => {
    alert(`Viewing document: ${doc.name}`);
    // In a real implementation, this would open the document or initiate a download
  };
  
  return (
    <div className="document-manager">
      <h2>Document Management</h2>
      
      {/* Upload section */}
      <div className="upload-section">
        <h3>Upload New Document</h3>
        <div>
          <input 
            type="file" 
            onChange={handleFileChange}
          />
        </div>
        <div>
          <label>
            Document Name:
            <input 
              type="text" 
              value={newFileName} 
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter document name"
            />
          </label>
          <button 
            onClick={handleUpload}
            disabled={!selectedFile || !newFileName}
          >
            Upload
          </button>
        </div>
        {uploadStatus && (
          <div className="status-message">
            {uploadStatus}
          </div>
        )}
      </div>
      
      {/* Documents list */}
      <div className="documents-list">
        <h3>Documents {selectedParcelId ? `for Parcel ${selectedParcelId}` : ''}</h3>
        
        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Upload Date</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.name}</td>
                  <td>{doc.type}</td>
                  <td>{doc.uploadDate}</td>
                  <td>{formatFileSize(doc.size)}</td>
                  <td>
                    <button onClick={() => handleViewDocument(doc)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;