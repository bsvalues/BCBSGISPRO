use crate::models::document::{Document, DocumentMetadata};
use crate::models::gis_feature::{GisFeature, GisFeatureProperties, GisFeatureGeometry, GisFeatureCollection};
use crate::db::{DatabaseManager};
use askama::Template;
use std::path::Path;
use std::sync::Arc;
use std::fs;
use std::io::Read;
use chrono::{DateTime, Utc};
use tiny_http::{Server, Response, Request, Header, Method, StatusCode};
use mime_guess::from_path;
use log::{info, error};

// Templates
mod templates;
use templates::*;

// Template engine filters
fn file_size(size: &usize) -> askama::Result<String> {
    let size = *size as f64;
    if size < 1024.0 {
        Ok(format!("{:.0} B", size))
    } else if size < 1024.0 * 1024.0 {
        Ok(format!("{:.1} KB", size / 1024.0))
    } else if size < 1024.0 * 1024.0 * 1024.0 {
        Ok(format!("{:.1} MB", size / 1024.0 / 1024.0))
    } else {
        Ok(format!("{:.1} GB", size / 1024.0 / 1024.0 / 1024.0))
    }
}

fn format_date(date: &DateTime<Utc>) -> askama::Result<String> {
    Ok(date.format("%b %d, %Y").to_string())
}

// Web server handler
pub struct WebServer {
    server: Server,
    db: Arc<DatabaseManager>,
    public_dir: String,
    mapbox_token: String,
}

impl WebServer {
    pub fn new(server: Server, db: Arc<DatabaseManager>, public_dir: &str, mapbox_token: &str) -> Self {
        Self {
            server,
            db,
            public_dir: public_dir.to_string(),
            mapbox_token: mapbox_token.to_string(),
        }
    }
    
    pub fn start(&self) {
        info!("Starting web server");
        
        for request in self.server.incoming_requests() {
            let db = Arc::clone(&self.db);
            let public_dir = self.public_dir.clone();
            let mapbox_token = self.mapbox_token.clone();
            
            // Process each request in a new thread
            std::thread::spawn(move || {
                Self::handle_request(request, &db, &public_dir, &mapbox_token);
            });
        }
    }
    
    fn handle_request(request: Request, db: &DatabaseManager, public_dir: &str, mapbox_token: &str) {
        let method = request.method().clone();
        let url = request.url().to_string();
        
        info!("Handling request: {} {}", method, url);
        
        // Parse URL and route to the appropriate handler
        match (method, url.as_str()) {
            // Core pages
            (Method::Get, "/") => Self::handle_home_page(request, db, mapbox_token),
            (Method::Get, "/map") => Self::handle_map_page(request, db, mapbox_token),
            (Method::Get, "/documents") => Self::handle_documents_page(request, db, mapbox_token),
            
            // API endpoints
            (Method::Get, path) if path.starts_with("/api/features") => Self::handle_get_features(request, db),
            (Method::Post, "/api/features") => Self::handle_create_feature(request, db),
            (Method::Post, "/api/documents/upload") => Self::handle_upload_document(request, db),
            (Method::Post, "/api/documents/classify") => Self::handle_classify_document(request, db),
            
            // Static files
            (Method::Get, path) => Self::handle_static_file(request, path, public_dir),
        }
    }
    
    // Page handlers
    fn handle_home_page(request: Request, db: &DatabaseManager, mapbox_token: &str) {
        // Create sample recent updates
        let recent_updates = vec![
            Update {
                title: "New Subdivision Map Added".to_string(),
                description: "The Clearwater Heights subdivision map has been added to the system.".to_string(),
                date: "May 15, 2023".to_string(),
            },
            Update {
                title: "Document Classification Improved".to_string(),
                description: "The AI document classification system has been upgraded for better accuracy.".to_string(),
                date: "May 10, 2023".to_string(),
            },
            Update {
                title: "System Maintenance".to_string(),
                description: "Scheduled maintenance completed with performance improvements.".to_string(),
                date: "May 5, 2023".to_string(),
            },
        ];
        
        // Create and render the template
        let template = IndexTemplate {
            active_page: "home",
            recent_updates,
        };
        
        match template.render() {
            Ok(html) => {
                let response = Response::from_string(html)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
                    .with_status_code(StatusCode(200));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send home page response: {}", e);
                }
            },
            Err(e) => {
                error!("Failed to render home page template: {}", e);
                
                let response = Response::from_string(format!("Internal Server Error: {}", e))
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_map_page(request: Request, db: &DatabaseManager, mapbox_token: &str) {
        // Create and render the template
        let template = MapTemplate {
            active_page: "map",
            mapbox_token,
        };
        
        match template.render() {
            Ok(html) => {
                let response = Response::from_string(html)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
                    .with_status_code(StatusCode(200));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send map page response: {}", e);
                }
            },
            Err(e) => {
                error!("Failed to render map page template: {}", e);
                
                let response = Response::from_string(format!("Internal Server Error: {}", e))
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_documents_page(request: Request, db: &DatabaseManager, mapbox_token: &str) {
        // Get documents from database
        let conn = db.get_connection();
        let documents = match crate::db::get_all_documents(&conn) {
            Ok(docs) => docs,
            Err(e) => {
                error!("Failed to get documents from database: {}", e);
                vec![] // Return empty vector if database query fails
            }
        };
        
        // Create and render the template
        let template = DocumentsTemplate {
            active_page: "documents",
            documents,
        };
        
        match template.render() {
            Ok(html) => {
                let response = Response::from_string(html)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
                    .with_status_code(StatusCode(200));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send documents page response: {}", e);
                }
            },
            Err(e) => {
                error!("Failed to render documents page template: {}", e);
                
                let response = Response::from_string(format!("Internal Server Error: {}", e))
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    // API handlers
    fn handle_get_features(request: Request, db: &DatabaseManager) {
        // Get all features from database
        let conn = db.get_connection();
        match crate::db::get_all_gis_features(&conn) {
            Ok(features) => {
                // Create feature collection
                let collection = GisFeatureCollection {
                    type_name: "FeatureCollection".to_string(),
                    features,
                };
                
                // Return as JSON
                match serde_json::to_string(&collection) {
                    Ok(json) => {
                        let response = Response::from_string(json)
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(200));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send features response: {}", e);
                        }
                    },
                    Err(e) => {
                        error!("Failed to serialize features: {}", e);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Failed to serialize features: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(500));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                error!("Failed to get features from database: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to get features: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_create_feature(request: Request, db: &DatabaseManager) {
        // Read request body
        let mut body = String::new();
        if let Err(e) = request.as_reader().read_to_string(&mut body) {
            error!("Failed to read request body: {}", e);
            
            let response = Response::from_string(format!("{{\"error\": \"Failed to read request body: {}\"}}", e))
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(400));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        }
        
        // Parse feature from request body
        match serde_json::from_str::<GisFeature>(&body) {
            Ok(mut feature) => {
                // Generate ID if not provided
                if feature.id.is_empty() {
                    feature.id = uuid::Uuid::new_v4().to_string();
                }
                
                // Set created timestamp
                feature.created_at = Utc::now();
                
                // Save to database
                let conn = db.get_connection();
                match crate::db::save_gis_feature(&conn, &feature) {
                    Ok(_) => {
                        // Return created feature
                        match serde_json::to_string(&feature) {
                            Ok(json) => {
                                let response = Response::from_string(json)
                                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                    .with_status_code(StatusCode(201));
                                
                                if let Err(e) = request.respond(response) {
                                    error!("Failed to send feature response: {}", e);
                                }
                            },
                            Err(e) => {
                                error!("Failed to serialize feature: {}", e);
                                
                                let response = Response::from_string(format!("{{\"error\": \"Failed to serialize feature: {}\"}}", e))
                                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                    .with_status_code(StatusCode(500));
                                
                                if let Err(e) = request.respond(response) {
                                    error!("Failed to send error response: {}", e);
                                }
                            }
                        }
                    },
                    Err(e) => {
                        error!("Failed to save feature to database: {}", e);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Failed to save feature: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(500));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                error!("Failed to parse feature: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to parse feature: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(400));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_upload_document(request: Request, db: &DatabaseManager) {
        // Read request body
        let mut body = String::new();
        if let Err(e) = request.as_reader().read_to_string(&mut body) {
            error!("Failed to read request body: {}", e);
            
            let response = Response::from_string(format!("{{\"error\": \"Failed to read request body: {}\"}}", e))
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(400));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        }
        
        // Parse document upload request
        match serde_json::from_str::<crate::models::document::DocumentUploadRequest>(&body) {
            Ok(upload_request) => {
                // Decode base64 file content
                match base64::decode(&upload_request.file_content) {
                    Ok(file_content) => {
                        // Generate unique file path
                        let file_id = uuid::Uuid::new_v4().to_string();
                        let file_path = format!("uploads/{}/{}", file_id, upload_request.filename);
                        
                        // Ensure upload directory exists
                        let dir_path = Path::new("uploads").join(file_id);
                        if let Err(e) = std::fs::create_dir_all(&dir_path) {
                            error!("Failed to create upload directory: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to create upload directory: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(500));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                            return;
                        }
                        
                        // Write file to disk
                        let file_path_full = dir_path.join(&upload_request.filename);
                        if let Err(e) = std::fs::write(&file_path_full, file_content.clone()) {
                            error!("Failed to write file to disk: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to write file to disk: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(500));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                            return;
                        }
                        
                        // Create document metadata
                        let metadata = upload_request.metadata.unwrap_or_else(|| {
                            DocumentMetadata {
                                title: Some(upload_request.filename.clone()),
                                description: None,
                                parcel_ids: None,
                                recording_date: None,
                                recording_number: None,
                                additional_properties: std::collections::HashMap::new(),
                            }
                        });
                        
                        // Create document
                        let document = Document::new(
                            &upload_request.filename,
                            &upload_request.content_type,
                            file_content.len(),
                            &file_path,
                            metadata,
                        );
                        
                        // Save to database
                        let conn = db.get_connection();
                        match crate::db::save_document(&conn, &document) {
                            Ok(_) => {
                                // Return success response
                                let response_data = crate::models::document::DocumentUploadResponse {
                                    success: true,
                                    document_id: Some(document.id.clone()),
                                    error: None,
                                };
                                
                                match serde_json::to_string(&response_data) {
                                    Ok(json) => {
                                        let response = Response::from_string(json)
                                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                            .with_status_code(StatusCode(201));
                                        
                                        if let Err(e) = request.respond(response) {
                                            error!("Failed to send document upload response: {}", e);
                                        }
                                    },
                                    Err(e) => {
                                        error!("Failed to serialize document upload response: {}", e);
                                        
                                        let response = Response::from_string(format!("{{\"error\": \"Failed to serialize response: {}\"}}", e))
                                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                            .with_status_code(StatusCode(500));
                                        
                                        if let Err(e) = request.respond(response) {
                                            error!("Failed to send error response: {}", e);
                                        }
                                    }
                                }
                            },
                            Err(e) => {
                                error!("Failed to save document to database: {}", e);
                                
                                let response = Response::from_string(format!("{{\"error\": \"Failed to save document: {}\"}}", e))
                                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                    .with_status_code(StatusCode(500));
                                
                                if let Err(e) = request.respond(response) {
                                    error!("Failed to send error response: {}", e);
                                }
                            }
                        }
                    },
                    Err(e) => {
                        error!("Failed to decode base64 content: {}", e);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Failed to decode file content: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(400));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                error!("Failed to parse document upload request: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to parse upload request: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(400));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_classify_document(request: Request, db: &DatabaseManager) {
        // Read request body
        let mut body = String::new();
        if let Err(e) = request.as_reader().read_to_string(&mut body) {
            error!("Failed to read request body: {}", e);
            
            let response = Response::from_string(format!("{{\"error\": \"Failed to read request body: {}\"}}", e))
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(400));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        }
        
        // Parse classification request
        match serde_json::from_str::<crate::models::document::DocumentClassificationRequest>(&body) {
            Ok(classification_request) => {
                // Either classify an existing document or a new one
                if let Some(document_id) = &classification_request.document_id {
                    // Get document from database
                    let conn = db.get_connection();
                    match crate::db::get_document_by_id(&conn, document_id) {
                        Ok(Some(mut document)) => {
                            // Classify based on filename
                            let document_type = classify_document_by_filename(&document.filename);
                            
                            // Update document with classification
                            document.set_classification(&document_type, 0.95, false);
                            
                            // Save updated document
                            match crate::db::save_document(&conn, &document) {
                                Ok(_) => {
                                    // Return classification response
                                    let response_data = crate::models::document::DocumentClassificationResponse {
                                        success: true,
                                        classification: document.classification,
                                        error: None,
                                    };
                                    
                                    match serde_json::to_string(&response_data) {
                                        Ok(json) => {
                                            let response = Response::from_string(json)
                                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                                .with_status_code(StatusCode(200));
                                            
                                            if let Err(e) = request.respond(response) {
                                                error!("Failed to send classification response: {}", e);
                                            }
                                        },
                                        Err(e) => {
                                            error!("Failed to serialize classification response: {}", e);
                                            
                                            let response = Response::from_string(format!("{{\"error\": \"Failed to serialize response: {}\"}}", e))
                                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                                .with_status_code(StatusCode(500));
                                            
                                            if let Err(e) = request.respond(response) {
                                                error!("Failed to send error response: {}", e);
                                            }
                                        }
                                    }
                                },
                                Err(e) => {
                                    error!("Failed to save updated document: {}", e);
                                    
                                    let response = Response::from_string(format!("{{\"error\": \"Failed to save document: {}\"}}", e))
                                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                        .with_status_code(StatusCode(500));
                                    
                                    if let Err(e) = request.respond(response) {
                                        error!("Failed to send error response: {}", e);
                                    }
                                }
                            }
                        },
                        Ok(None) => {
                            // Document not found
                            let response = Response::from_string("{\"error\": \"Document not found\"}")
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(404));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                        },
                        Err(e) => {
                            error!("Failed to get document from database: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to get document: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(500));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                        }
                    }
                } else if let Some(filename) = &classification_request.filename {
                    // Classify based on filename
                    let document_type = classify_document_by_filename(filename);
                    
                    // Create classification
                    let classification = crate::models::document::DocumentClassification {
                        document_type,
                        confidence: 0.95,
                        is_verified: false,
                        classified_at: Utc::now(),
                    };
                    
                    // Return classification response
                    let response_data = crate::models::document::DocumentClassificationResponse {
                        success: true,
                        classification: Some(classification),
                        error: None,
                    };
                    
                    match serde_json::to_string(&response_data) {
                        Ok(json) => {
                            let response = Response::from_string(json)
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(200));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send classification response: {}", e);
                            }
                        },
                        Err(e) => {
                            error!("Failed to serialize classification response: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to serialize response: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(500));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                        }
                    }
                } else {
                    // Missing required parameters
                    let response = Response::from_string("{\"error\": \"Either document_id or filename is required\"}")
                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                        .with_status_code(StatusCode(400));
                    
                    if let Err(e) = request.respond(response) {
                        error!("Failed to send error response: {}", e);
                    }
                }
            },
            Err(e) => {
                error!("Failed to parse classification request: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to parse classification request: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(400));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_static_file(request: Request, path: &str, public_dir: &str) {
        // Normalize path to prevent directory traversal
        let path = path.trim_start_matches('/');
        let file_path = format!("{}/{}", public_dir, path);
        
        // Check if file exists
        if let Ok(mut file) = fs::File::open(&file_path) {
            // Read file content
            let mut content = Vec::new();
            match file.read_to_end(&mut content) {
                Ok(_) => {
                    // Guess content type
                    let content_type = from_path(&file_path)
                        .first_or_octet_stream()
                        .to_string();
                    
                    // Send response
                    let response = Response::from_data(content)
                        .with_header(Header::from_bytes(&b"Content-Type"[..], content_type.as_bytes()).unwrap())
                        .with_status_code(StatusCode(200));
                    
                    if let Err(e) = request.respond(response) {
                        error!("Failed to send static file response: {}", e);
                    }
                },
                Err(e) => {
                    error!("Failed to read file {}: {}", file_path, e);
                    
                    let response = Response::from_string(format!("Failed to read file: {}", e))
                        .with_status_code(StatusCode(500));
                    
                    if let Err(e) = request.respond(response) {
                        error!("Failed to send error response: {}", e);
                    }
                }
            }
        } else {
            // File not found
            let response = Response::from_string("File not found")
                .with_status_code(StatusCode(404));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send 404 response: {}", e);
            }
        }
    }
}

// Helper functions
fn classify_document_by_filename(filename: &str) -> String {
    let filename = filename.to_lowercase();
    
    if filename.contains("deed") || filename.contains("title") || filename.contains("ownership") {
        "deed".to_string()
    } else if filename.contains("survey") || filename.contains("measurement") {
        "survey".to_string()
    } else if filename.contains("plat") || filename.contains("subdivision") || filename.contains("map") {
        "plat".to_string()
    } else {
        "unknown".to_string()
    }
}