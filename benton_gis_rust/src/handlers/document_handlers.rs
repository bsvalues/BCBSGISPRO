use actix_web::{web, HttpResponse, Responder};
use log::{info, error};
use uuid::Uuid;
use chrono::Utc;

use crate::models::document::{
    DocumentClassificationRequest, 
    DocumentClassificationResponse,
    DocumentClassification
};

/// Endpoint to classify a document
pub async fn classify_document(
    data: web::Json<DocumentClassificationRequest>,
) -> impl Responder {
    // Extract the document ID or content
    let document_id = data.document_id;
    let file_content = &data.file_content;
    let filename = &data.filename;
    
    info!("Document classification request received");
    
    // Check if we have the required fields
    if document_id.is_none() && (file_content.is_none() || filename.is_none()) {
        error!("Missing required fields for document classification");
        return HttpResponse::BadRequest().json(DocumentClassificationResponse {
            success: false,
            classification: None,
            error: Some("Missing required fields: either document_id or file_content and filename".to_string()),
        });
    }
    
    // In a real implementation, this would use a machine learning model to classify the document
    // For now, we'll use a simple mock implementation based on filename
    let document_type = if let Some(filename) = &filename {
        classify_by_filename(filename)
    } else {
        "unknown".to_string()
    };
    
    // Create classification with high confidence
    let classification = DocumentClassification {
        document_type,
        confidence: 0.95,
        is_verified: false,
        classified_at: Utc::now(),
    };
    
    info!("Document classified as {}", classification.document_type);
    
    // Return the classification
    HttpResponse::Ok().json(DocumentClassificationResponse {
        success: true,
        classification: Some(classification),
        error: None,
    })
}

/// Simple classification based on filename
fn classify_by_filename(filename: &str) -> String {
    let lowercase = filename.to_lowercase();
    
    if lowercase.contains("deed") || lowercase.ends_with(".deed") {
        "deed".to_string()
    } else if lowercase.contains("survey") || lowercase.ends_with(".survey") {
        "survey".to_string()
    } else if lowercase.contains("plat") || lowercase.ends_with(".plat") {
        "plat".to_string()
    } else if lowercase.contains("tax") || lowercase.contains("assessment") {
        "tax_assessment".to_string()
    } else if lowercase.contains("boundary") || lowercase.contains("bla") {
        "boundary_line_adjustment".to_string()
    } else if lowercase.ends_with(".pdf") {
        "document".to_string()
    } else if lowercase.ends_with(".jpg") || lowercase.ends_with(".jpeg") || 
              lowercase.ends_with(".png") || lowercase.ends_with(".tif") || 
              lowercase.ends_with(".tiff") {
        "image".to_string()
    } else {
        "other".to_string()
    }
}

/// Endpoint to upload a document
pub async fn upload_document() -> impl Responder {
    // This would be implemented with multipart form data handling
    // For now, just return a placeholder response
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Document upload endpoint placeholder",
        "document_id": Uuid::new_v4().to_string()
    }))
}

/// Endpoint to get document by ID
pub async fn get_document(path: web::Path<String>) -> impl Responder {
    let document_id = path.into_inner();
    
    // Validate UUID format
    match Uuid::parse_str(&document_id) {
        Ok(_) => {
            // In a real implementation, we would fetch the document from the database
            HttpResponse::Ok().json(serde_json::json!({
                "id": document_id,
                "filename": "example.pdf",
                "content_type": "application/pdf",
                "file_size": 1024,
                "uploaded_at": Utc::now().to_rfc3339(),
                "classification": {
                    "document_type": "deed",
                    "confidence": 0.95
                }
            }))
        }
        Err(_) => {
            HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid document ID format"
            }))
        }
    }
}