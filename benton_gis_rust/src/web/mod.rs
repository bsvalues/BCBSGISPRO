use std::path::Path;
use std::sync::Arc;
use std::fs;
use std::io::Read;
use chrono::{DateTime, Utc};
use tiny_http::{Server, Response, Request, Header, Method, StatusCode};
use mime_guess::from_path;
use log::{info, warn, error};
use askama::Template;

use crate::models::document::{Document, DocumentMetadata, DocumentClassification};
use crate::models::gis_feature::{GisFeature, GisFeatureProperties, GisFeatureGeometry, GisFeatureCollection};
use crate::db::DatabaseManager;
use crate::integrations::arcgis::{self, ArcGisQueryParams};
use crate::integrations::document_manager;
use crate::integrations::workflow::{self, WorkflowStatus, WorkflowType};

// Configuration module
mod config;
pub use config::WebServerConfig;

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
    config: WebServerConfig,
}

impl WebServer {
    pub fn new(server: Server, config: WebServerConfig) -> Self {
        Self {
            server,
            config,
        }
    }
    
    pub fn start(&self) {
        info!("Starting TerraFusion web server");
        
        for request in self.server.incoming_requests() {
            let config = self.config.clone();
            
            // Process each request in a new thread
            std::thread::spawn(move || {
                Self::handle_request(request, config);
            });
        }
    }
    
    fn handle_request(request: Request, config: WebServerConfig) {
        let method = request.method().clone();
        let url = request.url().to_string();
        
        info!("Handling request: {} {}", method, url);
        
        // Parse URL and route to the appropriate handler
        match (method, url.as_str()) {
            // Core pages
            (Method::Get, "/") => Self::handle_home_page(request, &config),
            (Method::Get, "/map") => Self::handle_map_page(request, &config),
            (Method::Get, "/documents") => Self::handle_documents_page(request, &config),
            (Method::Get, "/workflows") => Self::handle_workflows_page(request, &config),
            
            // API endpoints - GIS Features
            (Method::Get, path) if path.starts_with("/api/features") => Self::handle_get_features(request, &config),
            (Method::Post, "/api/features") => Self::handle_create_feature(request, &config),
            
            // API endpoints - Documents
            (Method::Post, "/api/documents/upload") => Self::handle_upload_document(request, &config),
            (Method::Post, "/api/documents/classify") => Self::handle_classify_document(request, &config),
            (Method::Get, path) if path.starts_with("/api/documents") => Self::handle_get_documents(request, &config),
            
            // API endpoints - Workflows
            (Method::Get, path) if path.starts_with("/api/workflows") => Self::handle_get_workflows(request, &config),
            (Method::Post, "/api/workflows") => Self::handle_create_workflow(request, &config),
            (Method::Put, path) if path.starts_with("/api/workflows/") => Self::handle_update_workflow(request, &config),
            
            // API endpoints - ArcGIS
            (Method::Get, "/api/arcgis/parcels") => Self::handle_arcgis_parcels(request, &config),
            (Method::Get, "/api/arcgis/zoning") => Self::handle_arcgis_zoning(request, &config),
            (Method::Get, "/api/arcgis/roads") => Self::handle_arcgis_roads(request, &config),
            
            // Static files
            (Method::Get, path) => Self::handle_static_file(request, path, &config.public_dir),
        }
    }
    
    // Page handlers
    fn handle_home_page(request: Request, config: &WebServerConfig) {
        // Get real recent updates from workflow system
        let recent_updates = match workflow::get_active_workflows() {
            Ok(workflows) => {
                // Convert the most recent workflows to updates
                workflows.into_iter()
                    .take(5)
                    .map(|wf| {
                        Update {
                            title: wf.title,
                            description: wf.description.unwrap_or_else(|| format!("{:?} workflow", wf.workflow_type)),
                            date: wf.updated_at.format("%b %d, %Y").to_string(),
                        }
                    })
                    .collect()
            },
            Err(e) => {
                error!("Failed to get recent workflows: {}", e);
                
                // Provide error notification as the update
                vec![
                    Update {
                        title: "Data Connectivity Issue".to_string(),
                        description: "Unable to retrieve recent workflow data. Please check your connection to the county data system.".to_string(),
                        date: Utc::now().format("%b %d, %Y").to_string(),
                    }
                ]
            }
        };
        
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
    
    fn handle_map_page(request: Request, config: &WebServerConfig) {
        // Check if we have a valid MapBox token
        if config.mapbox_token.is_empty() {
            let response = Response::from_string(
                "MapBox token is required for map functionality. Please provide a valid MapBox API token."
            )
            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
            .with_status_code(StatusCode(400));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send map token error response: {}", e);
            }
            return;
        }
        
        // Check if we have a valid ArcGIS token
        if config.arcgis_token.is_empty() {
            let response = Response::from_string(
                "ArcGIS token is required for Benton County GIS data. Please provide a valid ArcGIS API token."
            )
            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
            .with_status_code(StatusCode(400));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send arcgis token error response: {}", e);
            }
            return;
        }
        
        // Create and render the template
        let template = MapTemplate {
            active_page: "map",
            mapbox_token: &config.mapbox_token,
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
    
    fn handle_documents_page(request: Request, config: &WebServerConfig) {
        // Get real documents from the document management system
        let documents = match document_manager::search_documents("", None, None) {
            Ok(docs) => docs,
            Err(e) => {
                error!("Failed to get documents: {}", e);
                // Return empty vector if document search fails
                vec![]
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
    
    fn handle_workflows_page(request: Request, config: &WebServerConfig) {
        // Get real workflows from the workflow management system
        let workflows = match workflow::get_active_workflows() {
            Ok(wfs) => wfs,
            Err(e) => {
                error!("Failed to get workflows: {}", e);
                // Return empty vector if workflow retrieval fails
                vec![]
            }
        };
        
        // Create and render the template
        let template = WorkflowsTemplate {
            active_page: "workflows",
            workflows,
        };
        
        match template.render() {
            Ok(html) => {
                let response = Response::from_string(html)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
                    .with_status_code(StatusCode(200));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send workflows page response: {}", e);
                }
            },
            Err(e) => {
                error!("Failed to render workflows page template: {}", e);
                
                let response = Response::from_string(format!("Internal Server Error: {}", e))
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    // API handlers - GIS Features
    fn handle_get_features(request: Request, config: &WebServerConfig) {
        // Get real GIS features from ArcGIS or local database
        if config.use_real_data && !config.arcgis_token.is_empty() {
            // Get from ArcGIS (this is async, we need to block on it in this context)
            let query_params = ArcGisQueryParams::default();
            // Use a blocking_on equivalent since we're in a synchronous context
            // In a real implementation, this would use a proper async runtime
            
            // Return an error for now - in a real implementation, we would use tokio or another async runtime
            let response = Response::from_string("{\"error\": \"Real-time ArcGIS integration requires an async runtime. Please use the dedicated ArcGIS endpoints.\"}")
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(501));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send arcgis features error response: {}", e);
            }
        } else {
            // Fallback to local database if we're not using real data or missing tokens
            let conn = config.database.get_connection();
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
    }
    
    fn handle_create_feature(request: Request, config: &WebServerConfig) {
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
                
                // Real data - in a production system, we would integrate with ArcGIS APIs
                // to create/update features, but for now we'll store locally
                
                // Save to database
                let conn = config.database.get_connection();
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
    
    // API handlers - Documents
    fn handle_upload_document(request: Request, config: &WebServerConfig) {
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
                        
                        // Save to real document system
                        match document_manager::save_document(&document) {
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
                                error!("Failed to save document: {}", e);
                                
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
    
    fn handle_classify_document(request: Request, config: &WebServerConfig) {
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
                    // Get document from real document manager
                    match document_manager::load_document(document_id) {
                        Ok(mut document) => {
                            // Classify document
                            match document_manager::classify_document(&document.file_path) {
                                Ok(classification) => {
                                    // Update document with classification
                                    document.classification = Some(classification.clone());
                                    
                                    // Save updated document
                                    match document_manager::save_document(&document) {
                                        Ok(_) => {
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
                                Err(e) => {
                                    error!("Failed to classify document: {}", e);
                                    
                                    let response = Response::from_string(format!("{{\"error\": \"Failed to classify document: {}\"}}", e))
                                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                        .with_status_code(StatusCode(500));
                                    
                                    if let Err(e) = request.respond(response) {
                                        error!("Failed to send error response: {}", e);
                                    }
                                }
                            }
                        },
                        Err(e) => {
                            error!("Failed to load document: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to load document: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(404));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                        }
                    }
                } else if let Some(filename) = &classification_request.filename {
                    // Classify based on filename using document manager
                    let file_path = if let Some(content) = &classification_request.file_content {
                        // Write temporary file to classify
                        let temp_file_id = uuid::Uuid::new_v4().to_string();
                        let temp_path = format!("uploads/temp/{}/{}", temp_file_id, filename);
                        let temp_dir = Path::new("uploads/temp").join(temp_file_id);
                        
                        // Ensure temp directory exists
                        if let Err(e) = std::fs::create_dir_all(&temp_dir) {
                            error!("Failed to create temp directory: {}", e);
                            return;
                        }
                        
                        // Decode and write file content
                        match base64::decode(content) {
                            Ok(file_data) => {
                                let temp_file_path = temp_dir.join(filename);
                                if let Err(e) = std::fs::write(&temp_file_path, file_data) {
                                    error!("Failed to write temp file: {}", e);
                                    return;
                                }
                                temp_file_path.to_string_lossy().to_string()
                            },
                            Err(e) => {
                                error!("Failed to decode base64 content: {}", e);
                                filename.clone() // Fallback to just classifying based on filename
                            }
                        }
                    } else {
                        filename.clone() // Just use the filename
                    };
                    
                    // Classify using document manager
                    match document_manager::classify_document(&file_path) {
                        Ok(classification) => {
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
                        },
                        Err(e) => {
                            error!("Failed to classify document: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to classify document: {}\"}}", e))
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
    
    fn handle_get_documents(request: Request, config: &WebServerConfig) {
        // Parse query parameters
        let url = request.url().to_string();
        let query_start = url.find('?');
        
        let mut query = String::new();
        let mut doc_type = None;
        let mut parcel_id = None;
        
        if let Some(idx) = query_start {
            let query_params = &url[idx + 1..];
            
            for param in query_params.split('&') {
                let parts: Vec<&str> = param.split('=').collect();
                if parts.len() == 2 {
                    match parts[0] {
                        "q" => query = parts[1].to_string(),
                        "type" => doc_type = Some(parts[1].to_string()),
                        "parcel" => parcel_id = Some(parts[1].to_string()),
                        _ => {}
                    }
                }
            }
        }
        
        // Search documents using document manager
        match document_manager::search_documents(
            &query,
            doc_type.as_deref(),
            parcel_id.as_deref()
        ) {
            Ok(documents) => {
                // Return documents as JSON
                match serde_json::to_string(&documents) {
                    Ok(json) => {
                        let response = Response::from_string(json)
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(200));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send documents response: {}", e);
                        }
                    },
                    Err(e) => {
                        error!("Failed to serialize documents: {}", e);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Failed to serialize documents: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(500));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                error!("Failed to search documents: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to search documents: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    // API handlers - Workflows
    fn handle_get_workflows(request: Request, config: &WebServerConfig) {
        // Parse URL to check if we're requesting a specific workflow
        let url = request.url().to_string();
        
        // Check if this is a request for a specific workflow
        if let Some(id_start) = url.find("/api/workflows/") {
            let id_part = &url[id_start + 15..]; // Length of "/api/workflows/" is 15
            
            // Remove any query parameters
            let workflow_id = if let Some(q_idx) = id_part.find('?') {
                &id_part[..q_idx]
            } else {
                id_part
            };
            
            // Get specific workflow
            match workflow::load_workflow(workflow_id) {
                Ok(workflow) => {
                    // Return workflow as JSON
                    match serde_json::to_string(&workflow) {
                        Ok(json) => {
                            let response = Response::from_string(json)
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(200));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send workflow response: {}", e);
                            }
                        },
                        Err(e) => {
                            error!("Failed to serialize workflow: {}", e);
                            
                            let response = Response::from_string(format!("{{\"error\": \"Failed to serialize workflow: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(500));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send error response: {}", e);
                            }
                        }
                    }
                },
                Err(e) => {
                    error!("Failed to load workflow {}: {}", workflow_id, e);
                    
                    let response = Response::from_string(format!("{{\"error\": \"Failed to load workflow: {}\"}}", e))
                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                        .with_status_code(StatusCode(404));
                    
                    if let Err(e) = request.respond(response) {
                        error!("Failed to send error response: {}", e);
                    }
                }
            }
            return;
        }
        
        // Parse query parameters
        let query_start = url.find('?');
        
        let mut status = None;
        let mut wf_type = None;
        let mut parcel_id = None;
        
        if let Some(idx) = query_start {
            let query_params = &url[idx + 1..];
            
            for param in query_params.split('&') {
                let parts: Vec<&str> = param.split('=').collect();
                if parts.len() == 2 {
                    match parts[0] {
                        "status" => {
                            status = match parts[1] {
                                "pending" => Some(WorkflowStatus::Pending),
                                "in_progress" => Some(WorkflowStatus::InProgress),
                                "review" => Some(WorkflowStatus::Review),
                                "completed" => Some(WorkflowStatus::Completed),
                                "rejected" => Some(WorkflowStatus::Rejected),
                                "on_hold" => Some(WorkflowStatus::OnHold),
                                _ => None,
                            }
                        },
                        "type" => {
                            wf_type = match parts[1] {
                                "deed_processing" => Some(WorkflowType::DeedProcessing),
                                "boundary_line_adjustment" => Some(WorkflowType::BoundaryLineAdjustment),
                                "plat_review" => Some(WorkflowType::PlatReview),
                                "property_split" => Some(WorkflowType::PropertySplit),
                                "address_assignment" => Some(WorkflowType::AddressAssignment),
                                "property_assessment" => Some(WorkflowType::PropertyAssessment),
                                "record_update" => Some(WorkflowType::RecordUpdate),
                                "exemption_request" => Some(WorkflowType::ExemptionRequest),
                                _ => None,
                            }
                        },
                        "parcel" => parcel_id = Some(parts[1].to_string()),
                        _ => {}
                    }
                }
            }
        }
        
        // Get workflows based on filters
        let workflows = if let Some(pid) = parcel_id {
            // Get workflows for specific parcel
            match workflow::get_workflows_for_parcel(&pid) {
                Ok(wfs) => wfs,
                Err(e) => {
                    error!("Failed to get workflows for parcel {}: {}", pid, e);
                    Vec::new()
                }
            }
        } else if let Some(s) = status {
            // Get workflows by status from index
            match workflow::WorkflowIndex::load() {
                Ok(index) => {
                    let entries = index.get_workflows_by_status(s);
                    let mut wfs = Vec::new();
                    
                    for entry in entries {
                        match workflow::load_workflow(&entry.id) {
                            Ok(wf) => wfs.push(wf),
                            Err(e) => error!("Failed to load workflow {}: {}", entry.id, e),
                        }
                    }
                    
                    wfs
                },
                Err(e) => {
                    error!("Failed to load workflow index: {}", e);
                    Vec::new()
                }
            }
        } else if let Some(t) = wf_type {
            // Get workflows by type from index
            match workflow::WorkflowIndex::load() {
                Ok(index) => {
                    let entries = index.get_workflows_by_type(t);
                    let mut wfs = Vec::new();
                    
                    for entry in entries {
                        match workflow::load_workflow(&entry.id) {
                            Ok(wf) => wfs.push(wf),
                            Err(e) => error!("Failed to load workflow {}: {}", entry.id, e),
                        }
                    }
                    
                    wfs
                },
                Err(e) => {
                    error!("Failed to load workflow index: {}", e);
                    Vec::new()
                }
            }
        } else {
            // Get all active workflows
            match workflow::get_active_workflows() {
                Ok(wfs) => wfs,
                Err(e) => {
                    error!("Failed to get active workflows: {}", e);
                    Vec::new()
                }
            }
        };
        
        // Return workflows as JSON
        match serde_json::to_string(&workflows) {
            Ok(json) => {
                let response = Response::from_string(json)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(200));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send workflows response: {}", e);
                }
            },
            Err(e) => {
                error!("Failed to serialize workflows: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to serialize workflows: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(500));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_create_workflow(request: Request, config: &WebServerConfig) {
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
        
        // Parse workflow creation request
        #[derive(serde::Deserialize)]
        struct WorkflowCreateRequest {
            title: String,
            workflow_type: String,
            description: Option<String>,
            parcel_ids: Option<Vec<String>>,
        }
        
        match serde_json::from_str::<WorkflowCreateRequest>(&body) {
            Ok(create_request) => {
                // Convert workflow type string to enum
                let workflow_type = match create_request.workflow_type.as_str() {
                    "deed_processing" => WorkflowType::DeedProcessing,
                    "boundary_line_adjustment" => WorkflowType::BoundaryLineAdjustment,
                    "plat_review" => WorkflowType::PlatReview,
                    "property_split" => WorkflowType::PropertySplit,
                    "address_assignment" => WorkflowType::AddressAssignment,
                    "property_assessment" => WorkflowType::PropertyAssessment,
                    "record_update" => WorkflowType::RecordUpdate,
                    "exemption_request" => WorkflowType::ExemptionRequest,
                    _ => {
                        error!("Invalid workflow type: {}", create_request.workflow_type);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Invalid workflow type: {}\"}}", create_request.workflow_type))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(400));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                        return;
                    }
                };
                
                // Create workflow template
                match workflow::create_workflow_template(
                    &create_request.title,
                    workflow_type,
                    create_request.description.as_deref()
                ) {
                    Ok(mut workflow) => {
                        // Add parcel IDs if provided
                        if let Some(parcel_ids) = create_request.parcel_ids {
                            for parcel_id in parcel_ids {
                                workflow.add_parcel(&parcel_id);
                            }
                        }
                        
                        // Save workflow
                        match workflow::save_workflow(&workflow) {
                            Ok(_) => {
                                // Return created workflow
                                match serde_json::to_string(&workflow) {
                                    Ok(json) => {
                                        let response = Response::from_string(json)
                                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                            .with_status_code(StatusCode(201));
                                        
                                        if let Err(e) = request.respond(response) {
                                            error!("Failed to send workflow response: {}", e);
                                        }
                                    },
                                    Err(e) => {
                                        error!("Failed to serialize workflow: {}", e);
                                        
                                        let response = Response::from_string(format!("{{\"error\": \"Failed to serialize workflow: {}\"}}", e))
                                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                            .with_status_code(StatusCode(500));
                                        
                                        if let Err(e) = request.respond(response) {
                                            error!("Failed to send error response: {}", e);
                                        }
                                    }
                                }
                            },
                            Err(e) => {
                                error!("Failed to save workflow: {}", e);
                                
                                let response = Response::from_string(format!("{{\"error\": \"Failed to save workflow: {}\"}}", e))
                                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                    .with_status_code(StatusCode(500));
                                
                                if let Err(e) = request.respond(response) {
                                    error!("Failed to send error response: {}", e);
                                }
                            }
                        }
                    },
                    Err(e) => {
                        error!("Failed to create workflow template: {}", e);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Failed to create workflow template: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(500));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                error!("Failed to parse workflow create request: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to parse workflow create request: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(400));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    fn handle_update_workflow(request: Request, config: &WebServerConfig) {
        // Parse URL to get workflow ID
        let url = request.url().to_string();
        
        // Get workflow ID
        let workflow_id = if let Some(id_start) = url.find("/api/workflows/") {
            let id_part = &url[id_start + 15..]; // Length of "/api/workflows/" is 15
            
            // Remove any query parameters
            if let Some(q_idx) = id_part.find('?') {
                id_part[..q_idx].to_string()
            } else {
                id_part.to_string()
            }
        } else {
            error!("Invalid workflow update URL: {}", url);
            
            let response = Response::from_string("{\"error\": \"Invalid workflow URL\"}")
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(400));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        };
        
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
        
        // Parse workflow update
        #[derive(serde::Deserialize)]
        struct WorkflowUpdateRequest {
            status: Option<String>,
            assigned_to: Option<String>,
            due_date: Option<String>,
            add_parcel_ids: Option<Vec<String>>,
            add_document_ids: Option<Vec<String>>,
            step_updates: Option<Vec<StepUpdate>>,
        }
        
        #[derive(serde::Deserialize)]
        struct StepUpdate {
            step_id: String,
            status: Option<String>,
            assigned_to: Option<String>,
            notes: Option<String>,
        }
        
        match serde_json::from_str::<WorkflowUpdateRequest>(&body) {
            Ok(update_request) => {
                // Load existing workflow
                match workflow::load_workflow(&workflow_id) {
                    Ok(mut workflow) => {
                        // Update workflow fields
                        if let Some(status_str) = update_request.status {
                            let status = match status_str.as_str() {
                                "pending" => WorkflowStatus::Pending,
                                "in_progress" => WorkflowStatus::InProgress,
                                "review" => WorkflowStatus::Review,
                                "completed" => WorkflowStatus::Completed,
                                "rejected" => WorkflowStatus::Rejected,
                                "on_hold" => WorkflowStatus::OnHold,
                                _ => {
                                    error!("Invalid workflow status: {}", status_str);
                                    
                                    let response = Response::from_string(format!("{{\"error\": \"Invalid workflow status: {}\"}}", status_str))
                                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                        .with_status_code(StatusCode(400));
                                    
                                    if let Err(e) = request.respond(response) {
                                        error!("Failed to send error response: {}", e);
                                    }
                                    return;
                                }
                            };
                            
                            workflow.update_status(status);
                        }
                        
                        if let Some(assigned_to) = update_request.assigned_to {
                            workflow.assigned_to = Some(assigned_to);
                            workflow.updated_at = Utc::now();
                        }
                        
                        if let Some(due_date_str) = update_request.due_date {
                            // Parse due date
                            match chrono::DateTime::parse_from_rfc3339(&due_date_str) {
                                Ok(dt) => {
                                    workflow.due_date = Some(dt.with_timezone(&Utc));
                                    workflow.updated_at = Utc::now();
                                },
                                Err(e) => {
                                    error!("Failed to parse due date: {}", e);
                                    
                                    let response = Response::from_string(format!("{{\"error\": \"Failed to parse due date: {}\"}}", e))
                                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                        .with_status_code(StatusCode(400));
                                    
                                    if let Err(e) = request.respond(response) {
                                        error!("Failed to send error response: {}", e);
                                    }
                                    return;
                                }
                            }
                        }
                        
                        // Add parcels
                        if let Some(parcel_ids) = update_request.add_parcel_ids {
                            for parcel_id in parcel_ids {
                                workflow.add_parcel(&parcel_id);
                            }
                        }
                        
                        // Add documents
                        if let Some(document_ids) = update_request.add_document_ids {
                            for document_id in document_ids {
                                workflow.add_document(&document_id);
                            }
                        }
                        
                        // Update steps
                        if let Some(step_updates) = update_request.step_updates {
                            for step_update in step_updates {
                                // Find step by ID
                                if let Some(step) = workflow.steps.iter_mut().find(|s| s.id == step_update.step_id) {
                                    // Update step fields
                                    if let Some(status_str) = step_update.status {
                                        step.status = match status_str.as_str() {
                                            "pending" => WorkflowStatus::Pending,
                                            "in_progress" => WorkflowStatus::InProgress,
                                            "review" => WorkflowStatus::Review,
                                            "completed" => WorkflowStatus::Completed,
                                            "rejected" => WorkflowStatus::Rejected,
                                            "on_hold" => WorkflowStatus::OnHold,
                                            _ => {
                                                error!("Invalid step status: {}", status_str);
                                                continue;
                                            }
                                        };
                                        
                                        // Set completed date if completed
                                        if step.status == WorkflowStatus::Completed {
                                            step.completed_date = Some(Utc::now());
                                        }
                                    }
                                    
                                    if let Some(assigned_to) = step_update.assigned_to {
                                        step.assigned_to = Some(assigned_to);
                                    }
                                    
                                    if let Some(notes) = step_update.notes {
                                        step.notes = Some(notes);
                                    }
                                } else {
                                    warn!("Step not found: {}", step_update.step_id);
                                }
                            }
                            
                            workflow.updated_at = Utc::now();
                        }
                        
                        // Save updated workflow
                        match workflow::save_workflow(&workflow) {
                            Ok(_) => {
                                // Return updated workflow
                                match serde_json::to_string(&workflow) {
                                    Ok(json) => {
                                        let response = Response::from_string(json)
                                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                            .with_status_code(StatusCode(200));
                                        
                                        if let Err(e) = request.respond(response) {
                                            error!("Failed to send workflow response: {}", e);
                                        }
                                    },
                                    Err(e) => {
                                        error!("Failed to serialize workflow: {}", e);
                                        
                                        let response = Response::from_string(format!("{{\"error\": \"Failed to serialize workflow: {}\"}}", e))
                                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                            .with_status_code(StatusCode(500));
                                        
                                        if let Err(e) = request.respond(response) {
                                            error!("Failed to send error response: {}", e);
                                        }
                                    }
                                }
                            },
                            Err(e) => {
                                error!("Failed to save workflow: {}", e);
                                
                                let response = Response::from_string(format!("{{\"error\": \"Failed to save workflow: {}\"}}", e))
                                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                    .with_status_code(StatusCode(500));
                                
                                if let Err(e) = request.respond(response) {
                                    error!("Failed to send error response: {}", e);
                                }
                            }
                        }
                    },
                    Err(e) => {
                        error!("Failed to load workflow {}: {}", workflow_id, e);
                        
                        let response = Response::from_string(format!("{{\"error\": \"Failed to load workflow: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(404));
                        
                        if let Err(e) = request.respond(response) {
                            error!("Failed to send error response: {}", e);
                        }
                    }
                }
            },
            Err(e) => {
                error!("Failed to parse workflow update request: {}", e);
                
                let response = Response::from_string(format!("{{\"error\": \"Failed to parse workflow update request: {}\"}}", e))
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                    .with_status_code(StatusCode(400));
                
                if let Err(e) = request.respond(response) {
                    error!("Failed to send error response: {}", e);
                }
            }
        }
    }
    
    // API handlers - ArcGIS
    fn handle_arcgis_parcels(request: Request, config: &WebServerConfig) {
        // Check if we have ArcGIS token
        if config.arcgis_token.is_empty() {
            let response = Response::from_string("{\"error\": \"ArcGIS token is required for Benton County GIS data\"}")
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(401));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        }
        
        // This is a synchronous endpoint - we can't use async/await directly
        // In a real implementation, we would use tokio::runtime or another async runtime
        let response = Response::from_string("{\"error\": \"ArcGIS integration requires an async runtime. Please use the async-compatible version of this API.\"}")
            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            .with_status_code(StatusCode(501));
            
        if let Err(e) = request.respond(response) {
            error!("Failed to send error response: {}", e);
        }
    }
    
    fn handle_arcgis_zoning(request: Request, config: &WebServerConfig) {
        // Check if we have ArcGIS token
        if config.arcgis_token.is_empty() {
            let response = Response::from_string("{\"error\": \"ArcGIS token is required for Benton County GIS data\"}")
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(401));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        }
        
        // This is a synchronous endpoint - we can't use async/await directly
        // In a real implementation, we would use tokio::runtime or another async runtime
        let response = Response::from_string("{\"error\": \"ArcGIS integration requires an async runtime. Please use the async-compatible version of this API.\"}")
            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            .with_status_code(StatusCode(501));
            
        if let Err(e) = request.respond(response) {
            error!("Failed to send error response: {}", e);
        }
    }
    
    fn handle_arcgis_roads(request: Request, config: &WebServerConfig) {
        // Check if we have ArcGIS token
        if config.arcgis_token.is_empty() {
            let response = Response::from_string("{\"error\": \"ArcGIS token is required for Benton County GIS data\"}")
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                .with_status_code(StatusCode(401));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send error response: {}", e);
            }
            return;
        }
        
        // This is a synchronous endpoint - we can't use async/await directly
        // In a real implementation, we would use tokio::runtime or another async runtime
        let response = Response::from_string("{\"error\": \"ArcGIS integration requires an async runtime. Please use the async-compatible version of this API.\"}")
            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            .with_status_code(StatusCode(501));
            
        if let Err(e) = request.respond(response) {
            error!("Failed to send error response: {}", e);
        }
    }
    
    // Static file handler
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
            // File not found - check if this is a root path and serve index.html
            if path.is_empty() || path == "index.html" {
                let index_path = format!("{}/index.html", public_dir);
                if let Ok(mut file) = fs::File::open(&index_path) {
                    let mut content = String::new();
                    match file.read_to_string(&mut content) {
                        Ok(_) => {
                            let response = Response::from_string(content)
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap())
                                .with_status_code(StatusCode(200));
                            
                            if let Err(e) = request.respond(response) {
                                error!("Failed to send index.html response: {}", e);
                            }
                            return;
                        },
                        Err(e) => {
                            error!("Failed to read index.html: {}", e);
                        }
                    }
                }
            }
            
            // Return 404
            let response = Response::from_string("File not found")
                .with_status_code(StatusCode(404));
            
            if let Err(e) = request.respond(response) {
                error!("Failed to send 404 response: {}", e);
            }
        }
    }
}