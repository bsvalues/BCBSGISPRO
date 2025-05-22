use serde::{Deserialize, Serialize};
use std::error::Error;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use log::{info, error};
use chrono::{DateTime, Utc};
use crate::models::document::{Document, DocumentMetadata, DocumentClassification};

// Document storage paths - will contain real Benton County documents
const DOCUMENT_STORAGE_PATH: &str = "data/documents";
const DOCUMENT_INDEX_PATH: &str = "data/document_index.json";

// Document type identification keywords
const DEED_KEYWORDS: [&str; 6] = ["deed", "warranty", "quitclaim", "title", "conveyance", "transfer"];
const SURVEY_KEYWORDS: [&str; 5] = ["survey", "plat", "boundary", "measurement", "elevation"];
const PLAT_KEYWORDS: [&str; 6] = ["plat", "subdivision", "lot", "block", "addition", "development"];
const PERMIT_KEYWORDS: [&str; 5] = ["permit", "approval", "building", "construction", "development"];

/// Document index structure for tracking all documents
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentIndex {
    pub documents: HashMap<String, DocumentIndexEntry>,
    pub last_updated: DateTime<Utc>,
}

/// Entry in the document index
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentIndexEntry {
    pub id: String,
    pub filename: String,
    pub document_type: String,
    pub upload_date: DateTime<Utc>,
    pub parcel_ids: Vec<String>,
    pub file_path: String,
    pub file_size: usize,
}

impl DocumentIndex {
    /// Create a new empty document index
    pub fn new() -> Self {
        Self {
            documents: HashMap::new(),
            last_updated: Utc::now(),
        }
    }
    
    /// Load document index from file
    pub fn load() -> Result<Self, Box<dyn Error>> {
        let path = Path::new(DOCUMENT_INDEX_PATH);
        
        // Create empty index if file doesn't exist
        if !path.exists() {
            let empty_index = Self::new();
            empty_index.save()?;
            return Ok(empty_index);
        }
        
        // Read and parse the index file
        let index_content = fs::read_to_string(path)?;
        let index: DocumentIndex = serde_json::from_str(&index_content)?;
        
        Ok(index)
    }
    
    /// Save document index to file
    pub fn save(&self) -> Result<(), Box<dyn Error>> {
        // Create directory if it doesn't exist
        let path = Path::new(DOCUMENT_INDEX_PATH);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        // Serialize and save the index
        let index_content = serde_json::to_string_pretty(self)?;
        fs::write(path, index_content)?;
        
        Ok(())
    }
    
    /// Add document to the index
    pub fn add_document(&mut self, document: &Document) -> Result<(), Box<dyn Error>> {
        // Extract document type
        let document_type = match &document.classification {
            Some(classification) => classification.document_type.clone(),
            None => "unknown".to_string(),
        };
        
        // Extract parcel IDs
        let parcel_ids = document.metadata.parcel_ids.clone().unwrap_or_else(Vec::new);
        
        // Create index entry
        let entry = DocumentIndexEntry {
            id: document.id.clone(),
            filename: document.filename.clone(),
            document_type,
            upload_date: document.uploaded_at,
            parcel_ids,
            file_path: document.file_path.clone(),
            file_size: document.file_size,
        };
        
        // Add to index
        self.documents.insert(document.id.clone(), entry);
        self.last_updated = Utc::now();
        
        // Save updated index
        self.save()?;
        
        Ok(())
    }
    
    /// Get all documents in the index
    pub fn get_all_documents(&self) -> Vec<DocumentIndexEntry> {
        self.documents.values().cloned().collect()
    }
    
    /// Get documents by parcel ID
    pub fn get_documents_by_parcel(&self, parcel_id: &str) -> Vec<DocumentIndexEntry> {
        self.documents.values()
            .filter(|entry| entry.parcel_ids.contains(&parcel_id.to_string()))
            .cloned()
            .collect()
    }
    
    /// Get documents by type
    pub fn get_documents_by_type(&self, document_type: &str) -> Vec<DocumentIndexEntry> {
        self.documents.values()
            .filter(|entry| entry.document_type == document_type)
            .cloned()
            .collect()
    }
}

/// Load a document by ID
pub fn load_document(document_id: &str) -> Result<Document, Box<dyn Error>> {
    // Load document index
    let index = DocumentIndex::load()?;
    
    // Find document in index
    let entry = match index.documents.get(document_id) {
        Some(entry) => entry,
        None => return Err(format!("Document not found: {}", document_id).into()),
    };
    
    // Check if file exists
    let file_path = Path::new(&entry.file_path);
    if !file_path.exists() {
        return Err(format!("Document file not found: {}", entry.file_path).into());
    }
    
    // Get file metadata
    let metadata = fs::metadata(file_path)?;
    let file_size = metadata.len() as usize;
    
    // Determine content type based on extension
    let content_type = match file_path.extension().and_then(|ext| ext.to_str()) {
        Some("pdf") => "application/pdf",
        Some("docx") => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        Some("doc") => "application/msword",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("tif" | "tiff") => "image/tiff",
        _ => "application/octet-stream",
    };
    
    // Create document classification
    let classification = Some(DocumentClassification {
        document_type: entry.document_type.clone(),
        confidence: 0.95, // Placeholder, would be from actual AI model
        is_verified: true,
        classified_at: entry.upload_date,
    });
    
    // Create document metadata
    let metadata = DocumentMetadata {
        title: Some(entry.filename.clone()),
        description: None,
        parcel_ids: Some(entry.parcel_ids.clone()),
        recording_date: None,
        recording_number: None,
        additional_properties: HashMap::new(),
    };
    
    // Create document object
    let document = Document {
        id: document_id.to_string(),
        filename: entry.filename.clone(),
        content_type: content_type.to_string(),
        file_size,
        file_path: entry.file_path.clone(),
        classification,
        metadata,
        uploaded_at: entry.upload_date,
        uploaded_by: None,
    };
    
    Ok(document)
}

/// Save a document to storage and index
pub fn save_document(document: &Document) -> Result<(), Box<dyn Error>> {
    // Make sure document directory exists
    let storage_dir = Path::new(DOCUMENT_STORAGE_PATH);
    fs::create_dir_all(storage_dir)?;
    
    // Copy document to storage if it's not already there
    let source_path = Path::new(&document.file_path);
    let target_dir = storage_dir.join(&document.id);
    fs::create_dir_all(&target_dir)?;
    
    let target_path = target_dir.join(&document.filename);
    if target_path != source_path {
        fs::copy(source_path, &target_path)?;
    }
    
    // Update document path to the new location
    let mut updated_document = document.clone();
    updated_document.file_path = target_path.to_string_lossy().to_string();
    
    // Add to index
    let mut index = DocumentIndex::load()?;
    index.add_document(&updated_document)?;
    
    Ok(())
}

/// Classify a document based on content
pub fn classify_document(document_path: &str) -> Result<DocumentClassification, Box<dyn Error>> {
    info!("Classifying document: {}", document_path);
    
    // In a real implementation, this would use machine learning or text extraction
    // For now, we'll use a simple keyword-based approach
    
    let path = Path::new(document_path);
    let filename = path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown")
        .to_lowercase();
    
    // Determine document type based on filename
    let document_type = if DEED_KEYWORDS.iter().any(|keyword| filename.contains(keyword)) {
        "deed"
    } else if SURVEY_KEYWORDS.iter().any(|keyword| filename.contains(keyword)) {
        "survey"
    } else if PLAT_KEYWORDS.iter().any(|keyword| filename.contains(keyword)) {
        "plat"
    } else if PERMIT_KEYWORDS.iter().any(|keyword| filename.contains(keyword)) {
        "permit"
    } else {
        "unknown"
    };
    
    // Create classification
    let classification = DocumentClassification {
        document_type: document_type.to_string(),
        confidence: 0.85, // Placeholder, would be from actual AI model
        is_verified: false,
        classified_at: Utc::now(),
    };
    
    Ok(classification)
}

/// Get documents for a specific parcel
pub fn get_parcel_documents(parcel_id: &str) -> Result<Vec<Document>, Box<dyn Error>> {
    // Load document index
    let index = DocumentIndex::load()?;
    
    // Get document entries for this parcel
    let entries = index.get_documents_by_parcel(parcel_id);
    
    // Load full document for each entry
    let mut documents = Vec::new();
    for entry in entries {
        match load_document(&entry.id) {
            Ok(document) => documents.push(document),
            Err(e) => error!("Failed to load document {}: {}", entry.id, e),
        }
    }
    
    Ok(documents)
}

/// Search for documents by criteria
pub fn search_documents(query: &str, document_type: Option<&str>, parcel_id: Option<&str>) -> Result<Vec<Document>, Box<dyn Error>> {
    // Load document index
    let index = DocumentIndex::load()?;
    
    // Filter documents by criteria
    let matching_entries = index.documents.values().filter(|entry| {
        // Match query in filename
        let filename_match = entry.filename.to_lowercase().contains(&query.to_lowercase());
        
        // Match document type if specified
        let type_match = match document_type {
            Some(doc_type) => entry.document_type == doc_type,
            None => true,
        };
        
        // Match parcel ID if specified
        let parcel_match = match parcel_id {
            Some(pid) => entry.parcel_ids.contains(&pid.to_string()),
            None => true,
        };
        
        filename_match && type_match && parcel_match
    });
    
    // Load full document for each matching entry
    let mut documents = Vec::new();
    for entry in matching_entries {
        match load_document(&entry.id) {
            Ok(document) => documents.push(document),
            Err(e) => error!("Failed to load document {}: {}", entry.id, e),
        }
    }
    
    Ok(documents)
}

/// Initialize the document system by scanning existing files
pub fn initialize_document_system() -> Result<(), Box<dyn Error>> {
    info!("Initializing document management system");
    
    // Create storage directory if it doesn't exist
    let storage_dir = Path::new(DOCUMENT_STORAGE_PATH);
    fs::create_dir_all(storage_dir)?;
    
    // Create or load document index
    let mut index = DocumentIndex::load()?;
    
    // Scan storage directory for documents
    scan_documents_directory(storage_dir, &mut index)?;
    
    info!("Document system initialized with {} documents", index.documents.len());
    
    Ok(())
}

/// Scan a directory for documents and add them to the index
fn scan_documents_directory(dir: &Path, index: &mut DocumentIndex) -> Result<(), Box<dyn Error>> {
    if !dir.is_dir() {
        return Ok(());
    }
    
    // Process each entry in the directory
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        
        if path.is_dir() {
            // Recursively scan subdirectories
            scan_documents_directory(&path, index)?;
        } else {
            // Process file if it's not already in the index
            let file_id = path.parent()
                .and_then(|parent| parent.file_name())
                .and_then(|name| name.to_str())
                .unwrap_or_default();
                
            if !index.documents.contains_key(file_id) && file_id.len() > 10 {
                // This appears to be a document directory with a UUID
                process_document_file(&path, file_id, index)?;
            }
        }
    }
    
    Ok(())
}

/// Process a document file and add it to the index
fn process_document_file(path: &Path, document_id: &str, index: &mut DocumentIndex) -> Result<(), Box<dyn Error>> {
    // Get file metadata
    let metadata = fs::metadata(path)?;
    let file_size = metadata.len() as usize;
    
    // Get filename
    let filename = path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    // Classify document
    let classification = classify_document(path.to_str().unwrap_or_default())?;
    
    // Create document metadata
    let doc_metadata = DocumentMetadata {
        title: Some(filename.clone()),
        description: None,
        parcel_ids: None, // We don't have this information from just the file
        recording_date: None,
        recording_number: None,
        additional_properties: HashMap::new(),
    };
    
    // Create document object
    let document = Document {
        id: document_id.to_string(),
        filename,
        content_type: "application/octet-stream".to_string(), // Default, would be determined properly
        file_size,
        file_path: path.to_string_lossy().to_string(),
        classification: Some(classification),
        metadata: doc_metadata,
        uploaded_at: Utc::now(), // We don't know the actual upload time
        uploaded_by: None,
    };
    
    // Add to index
    index.add_document(&document)?;
    
    info!("Added document to index: {}", document_id);
    
    Ok(())
}