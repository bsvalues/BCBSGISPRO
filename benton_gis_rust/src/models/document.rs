use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Represents a document in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Unique identifier for the document
    pub id: Uuid,
    /// Document filename
    pub filename: String,
    /// Document content type (MIME type)
    pub content_type: String,
    /// Size of document in bytes
    pub file_size: usize,
    /// Path to document in storage
    pub file_path: String,
    /// Document classification (deed, survey, etc.)
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
    /// Extracted text content
    pub extracted_text: Option<String>,
    /// Additional metadata stored as JSON
    #[serde(flatten)]
    pub additional_properties: std::collections::HashMap<String, serde_json::Value>,
}

/// Classification request from client
#[derive(Debug, Deserialize)]
pub struct DocumentClassificationRequest {
    /// Document ID to classify
    pub document_id: Option<Uuid>,
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