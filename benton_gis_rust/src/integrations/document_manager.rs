use std::fs;
use std::path::{Path, PathBuf};
use std::io::Write;
use std::collections::HashMap;
use log::{info, error};
use chrono::Utc;
use rusqlite::Connection;
use tokio::fs as tokio_fs;
use uuid::Uuid;
use std::sync::Mutex;

use crate::models::document::{Document, DocumentMetadata, DocumentClassification};
use crate::db;

pub struct DocumentManager {
    storage_path: PathBuf,
    conn: Mutex<Connection>,
}

impl DocumentManager {
    pub fn new<P: AsRef<Path>>(storage_path: P, conn: Connection) -> Self {
        let storage_path = storage_path.as_ref().to_path_buf();
        
        // Ensure the storage directory exists
        if !storage_path.exists() {
            fs::create_dir_all(&storage_path).unwrap_or_else(|e| {
                error!("Failed to create document storage directory: {}", e);
            });
        }
        
        Self {
            storage_path,
            conn: Mutex::new(conn),
        }
    }
    
    pub async fn upload_document(&self, filename: &str, content_type: &str, content: &[u8], metadata: DocumentMetadata) -> Result<Document, String> {
        info!("Uploading document: {}", filename);
        
        // Generate a unique ID for the document
        let id = Uuid::new_v4().to_string();
        
        // Create a directory for the document
        let document_dir = self.storage_path.join(&id);
        tokio_fs::create_dir_all(&document_dir).await
            .map_err(|e| format!("Failed to create document directory: {}", e))?;
        
        // Save the file
        let file_path = document_dir.join(filename);
        tokio_fs::write(&file_path, content).await
            .map_err(|e| format!("Failed to write document file: {}", e))?;
        
        // Create the document record
        let document = Document::new(
            filename,
            content_type,
            content.len(),
            file_path.to_str().unwrap_or(""),
            metadata,
        );
        
        // Save the document in the database
        db::save_document(&self.conn.lock().unwrap(), &document)
            .map_err(|e| format!("Failed to save document in database: {}", e))?;
        
        Ok(document)
    }
    
    pub async fn get_document(&self, id: &str) -> Result<Option<Document>, String> {
        info!("Retrieving document: {}", id);
        
        // Get the document from the database
        let document = db::get_document_by_id(&self.conn.lock().unwrap(), id)
            .map_err(|e| format!("Failed to retrieve document from database: {}", e))?;
        
        Ok(document)
    }
    
    pub async fn get_document_content(&self, id: &str) -> Result<Option<Vec<u8>>, String> {
        info!("Retrieving document content: {}", id);
        
        // Get the document from the database
        let document = match db::get_document_by_id(&self.conn.lock().unwrap(), id)
            .map_err(|e| format!("Failed to retrieve document from database: {}", e))? {
            Some(doc) => doc,
            None => return Ok(None),
        };
        
        // Read the file content
        let content = tokio_fs::read(&document.file_path).await
            .map_err(|e| format!("Failed to read document file: {}", e))?;
        
        Ok(Some(content))
    }
    
    pub async fn get_documents(&self) -> Result<Vec<Document>, String> {
        info!("Retrieving all documents");
        
        // Get all documents from the database
        let documents = db::get_all_documents(&self.conn.lock().unwrap())
            .map_err(|e| format!("Failed to retrieve documents from database: {}", e))?;
        
        Ok(documents)
    }
    
    pub async fn get_documents_by_parcel(&self, parcel_id: &str) -> Result<Vec<Document>, String> {
        info!("Retrieving documents for parcel: {}", parcel_id);
        
        // Get documents associated with the parcel from the database
        let documents = db::get_documents_by_parcel(&self.conn.lock().unwrap(), parcel_id)
            .map_err(|e| format!("Failed to retrieve documents for parcel from database: {}", e))?;
        
        Ok(documents)
    }
    
    pub async fn classify_document(&self, id: &str, document_type: &str, confidence: f64) -> Result<Document, String> {
        info!("Classifying document {} as {} with confidence {}", id, document_type, confidence);
        
        // Get the document from the database
        let mut document = match db::get_document_by_id(&self.conn.lock().unwrap(), id)
            .map_err(|e| format!("Failed to retrieve document from database: {}", e))? {
            Some(doc) => doc,
            None => return Err(format!("Document not found: {}", id)),
        };
        
        // Update the classification
        document.set_classification(document_type, confidence, false);
        
        // Save the updated document in the database
        db::save_document(&self.conn.lock().unwrap(), &document)
            .map_err(|e| format!("Failed to save updated document in database: {}", e))?;
        
        Ok(document)
    }
    
    pub async fn verify_classification(&self, id: &str, is_verified: bool) -> Result<Document, String> {
        info!("Verifying classification for document: {}", id);
        
        // Get the document from the database
        let mut document = match db::get_document_by_id(&self.conn.lock().unwrap(), id)
            .map_err(|e| format!("Failed to retrieve document from database: {}", e))? {
            Some(doc) => doc,
            None => return Err(format!("Document not found: {}", id)),
        };
        
        // Update the classification verification status
        if let Some(ref mut classification) = document.classification {
            classification.is_verified = is_verified;
        } else {
            return Err(format!("Document has no classification to verify: {}", id));
        }
        
        // Save the updated document in the database
        db::save_document(&self.conn.lock().unwrap(), &document)
            .map_err(|e| format!("Failed to save updated document in database: {}", e))?;
        
        Ok(document)
    }
    
    pub async fn update_document_metadata(&self, id: &str, metadata: DocumentMetadata) -> Result<Document, String> {
        info!("Updating metadata for document: {}", id);
        
        // Get the document from the database
        let mut document = match db::get_document_by_id(&self.conn.lock().unwrap(), id)
            .map_err(|e| format!("Failed to retrieve document from database: {}", e))? {
            Some(doc) => doc,
            None => return Err(format!("Document not found: {}", id)),
        };
        
        // Update the metadata
        document.metadata = metadata;
        
        // Save the updated document in the database
        db::save_document(&self.conn.lock().unwrap(), &document)
            .map_err(|e| format!("Failed to save updated document in database: {}", e))?;
        
        Ok(document)
    }
    
    pub async fn delete_document(&self, id: &str) -> Result<(), String> {
        info!("Deleting document: {}", id);
        
        // Get the document from the database
        let document = match db::get_document_by_id(&self.conn.lock().unwrap(), id)
            .map_err(|e| format!("Failed to retrieve document from database: {}", e))? {
            Some(doc) => doc,
            None => return Err(format!("Document not found: {}", id)),
        };
        
        // Delete the file
        let file_path = Path::new(&document.file_path);
        if file_path.exists() {
            tokio_fs::remove_file(file_path).await
                .map_err(|e| format!("Failed to delete document file: {}", e))?;
        }
        
        // Delete the document directory if it exists and is empty
        let document_dir = self.storage_path.join(id);
        if document_dir.exists() {
            if let Ok(entries) = fs::read_dir(&document_dir) {
                if entries.count() == 0 {
                    tokio_fs::remove_dir(&document_dir).await
                        .map_err(|e| format!("Failed to delete document directory: {}", e))?;
                }
            }
        }
        
        // TODO: Delete the document from the database
        // This would require adding a delete_document function to the db module
        
        Ok(())
    }
}