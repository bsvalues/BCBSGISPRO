use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Represents a document in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Unique identifier for the document
    pub id: String,
    /// Document filename
    pub filename: String,
    /// Document content type (MIME type)
    pub content_type: String,
    /// Size of document in bytes
    pub file_size: usize,
    /// Path to document in storage
    pub file_path: String,
    /// Document classification information
    pub classification: Option<DocumentClassification>,
    /// Document metadata
    pub metadata: DocumentMetadata,
    /// Timestamp when the document was uploaded
    pub uploaded_at: DateTime<Utc>,
    /// User who uploaded this document
    pub uploaded_by: Option<String>,
}

/// Document classification information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentClassification {
    /// Type of document (deed, survey, plat, etc.)
    pub document_type: String,
    /// Confidence score for the classification (0.0 to 1.0)
    pub confidence: f32,
    /// Whether this classification was verified by a human
    pub is_verified: bool,
    /// Timestamp when classification was performed
    pub classified_at: DateTime<Utc>,
}

/// Metadata associated with a document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    /// Document title or name
    pub title: Option<String>,
    /// Document description
    pub description: Option<String>,
    /// Related parcel IDs
    pub parcel_ids: Option<Vec<String>>,
    /// Recording date if applicable
    pub recording_date: Option<DateTime<Utc>>,
    /// Recording number if applicable
    pub recording_number: Option<String>,
    /// Additional metadata stored as JSON
    #[serde(flatten)]
    pub additional_properties: HashMap<String, serde_json::Value>,
}

/// Classification request from client
#[derive(Debug, Deserialize)]
pub struct DocumentClassificationRequest {
    /// Document ID to classify (optional)
    pub document_id: Option<String>,
    /// File content as base64 string (if no document_id)
    pub file_content: Option<String>,
    /// Filename with extension
    pub filename: Option<String>,
}

/// Classification response to client
#[derive(Debug, Serialize)]
pub struct DocumentClassificationResponse {
    /// Whether classification was successful
    pub success: bool,
    /// Classification result
    pub classification: Option<DocumentClassification>,
    /// Any error message if applicable
    pub error: Option<String>,
}

/// Document upload request
#[derive(Debug, Deserialize)]
pub struct DocumentUploadRequest {
    /// File content as base64 string
    pub file_content: String,
    /// Filename with extension
    pub filename: String,
    /// Document content type
    pub content_type: String,
    /// Optional metadata to associate with the document
    pub metadata: Option<DocumentMetadata>,
}

/// Document upload response
#[derive(Debug, Serialize)]
pub struct DocumentUploadResponse {
    /// Whether upload was successful
    pub success: bool,
    /// Uploaded document ID
    pub document_id: Option<String>,
    /// Any error message if applicable
    pub error: Option<String>,
}

impl Document {
    /// Create a new document
    pub fn new(
        filename: &str, 
        content_type: &str, 
        file_size: usize, 
        file_path: &str,
        metadata: DocumentMetadata
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            filename: filename.to_string(),
            content_type: content_type.to_string(),
            file_size,
            file_path: file_path.to_string(),
            classification: None,
            metadata,
            uploaded_at: Utc::now(),
            uploaded_by: None,
        }
    }
    
    /// Add or update classification
    pub fn set_classification(&mut self, document_type: &str, confidence: f32, is_verified: bool) {
        self.classification = Some(DocumentClassification {
            document_type: document_type.to_string(),
            confidence,
            is_verified,
            classified_at: Utc::now(),
        });
    }
    
    /// Get document type if classified
    pub fn document_type(&self) -> Option<&str> {
        self.classification.as_ref().map(|c| c.document_type.as_str())
    }
}