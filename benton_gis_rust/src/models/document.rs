use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub filename: String,
    pub content_type: String,
    pub file_size: usize,
    pub file_path: String,
    pub classification: Option<DocumentClassification>,
    pub metadata: DocumentMetadata,
    pub uploaded_at: DateTime<Utc>,
    pub uploaded_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub parcel_ids: Option<Vec<String>>,
    pub recording_date: Option<DateTime<Utc>>,
    pub recording_number: Option<String>,
    pub additional_properties: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentClassification {
    pub document_type: String,
    pub confidence: f64,
    pub is_verified: bool,
    pub classified_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentUploadRequest {
    pub filename: String,
    pub content_type: String,
    pub file_content: String, // Base64 encoded file content
    pub metadata: Option<DocumentMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentUploadResponse {
    pub success: bool,
    pub document_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentClassificationRequest {
    pub document_id: Option<String>,
    pub filename: Option<String>,
    pub file_content: Option<String>, // Base64 encoded file content for classification
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentClassificationResponse {
    pub success: bool,
    pub classification: Option<DocumentClassification>,
    pub error: Option<String>,
}

impl Document {
    pub fn new(
        filename: &str,
        content_type: &str,
        file_size: usize,
        file_path: &str,
        metadata: DocumentMetadata,
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

    pub fn set_classification(
        &mut self,
        document_type: &str,
        confidence: f64,
        is_verified: bool,
    ) {
        self.classification = Some(DocumentClassification {
            document_type: document_type.to_string(),
            confidence,
            is_verified,
            classified_at: Utc::now(),
        });
    }
}