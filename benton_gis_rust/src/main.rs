use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::sync::{Arc, Mutex};
use std::thread;

use tiny_http::{Server, Response, Method, StatusCode, Header};
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// Basic data models
#[derive(Serialize, Deserialize, Clone)]
struct GisFeature {
    id: String,
    feature_type: String,
    properties: HashMap<String, serde_json::Value>,
    geometry: serde_json::Value,
    created_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
struct DocumentClassification {
    document_type: String,
    confidence: f32,
}

// Our global database (very simple for demo)
type Database = Arc<Mutex<Vec<GisFeature>>>;

fn main() {
    println!("Starting Benton County GIS Rust server...");
    
    // Create our database
    let database: Database = Arc::new(Mutex::new(Vec::new()));
    
    // Set port
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    // Create server
    let server = match Server::http(&addr) {
        Ok(server) => {
            println!("Benton County GIS Rust server running on http://{}", addr);
            server
        },
        Err(e) => {
            eprintln!("Error starting server: {}", e);
            return;
        }
    };
    
    // Main request loop
    for request in server.incoming_requests() {
        let db = database.clone();
        
        // Start a new thread for each request
        thread::spawn(move || {
            // Get method and URL
            let method = request.method().clone();
            let url = request.url().to_string();
            
            println!("Received request: {} {}", method, url);
            
            // Handle different endpoints
            match (method, url.as_str()) {
                // Health check
                (Method::Get, "/api/health") => {
                    let health_data = serde_json::json!({
                        "status": "healthy",
                        "version": env!("CARGO_PKG_VERSION"),
                        "service": "benton-gis-rust"
                    });
                    
                    let response = Response::from_string(health_data.to_string())
                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                        .with_status_code(StatusCode(200));
                    
                    if let Err(e) = request.respond(response) {
                        eprintln!("Error sending response: {}", e);
                    }
                },
                
                // Get all GIS features
                (Method::Get, "/api/features") => {
                    let features = db.lock().unwrap().clone();
                    
                    let response_data = serde_json::json!({
                        "type": "FeatureCollection",
                        "features": features
                    });
                    
                    let response = Response::from_string(response_data.to_string())
                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                        .with_status_code(StatusCode(200));
                    
                    if let Err(e) = request.respond(response) {
                        eprintln!("Error sending response: {}", e);
                    }
                },
                
                // Create a new GIS feature
                (Method::Post, "/api/features") => {
                    // Read the request body
                    let mut body = String::new();
                    if let Err(e) = request.as_reader().read_to_string(&mut body) {
                        eprintln!("Error reading request body: {}", e);
                        let response = Response::from_string(format!("{{\"error\": \"Failed to read request body: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(400));
                        
                        if let Err(e) = request.respond(response) {
                            eprintln!("Error sending response: {}", e);
                        }
                        return;
                    }
                    
                    // Parse as GisFeature
                    match serde_json::from_str::<GisFeature>(&body) {
                        Ok(mut feature) => {
                            // Set ID and timestamp
                            feature.id = Uuid::new_v4().to_string();
                            feature.created_at = Utc::now();
                            
                            // Add to database
                            db.lock().unwrap().push(feature.clone());
                            
                            // Respond
                            let response = Response::from_string(serde_json::to_string(&feature).unwrap())
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(201));
                            
                            if let Err(e) = request.respond(response) {
                                eprintln!("Error sending response: {}", e);
                            }
                        },
                        Err(e) => {
                            eprintln!("Error parsing GisFeature: {}", e);
                            let response = Response::from_string(format!("{{\"error\": \"Failed to parse feature: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(400));
                            
                            if let Err(e) = request.respond(response) {
                                eprintln!("Error sending response: {}", e);
                            }
                        }
                    }
                },
                
                // Document classification
                (Method::Post, "/api/documents/classify") => {
                    // Read the request body
                    let mut body = String::new();
                    if let Err(e) = request.as_reader().read_to_string(&mut body) {
                        eprintln!("Error reading request body: {}", e);
                        let response = Response::from_string(format!("{{\"error\": \"Failed to read request body: {}\"}}", e))
                            .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                            .with_status_code(StatusCode(400));
                        
                        if let Err(e) = request.respond(response) {
                            eprintln!("Error sending response: {}", e);
                        }
                        return;
                    }
                    
                    // Parse body
                    match serde_json::from_str::<serde_json::Value>(&body) {
                        Ok(doc_info) => {
                            // Get filename
                            let filename = doc_info.get("filename")
                                .and_then(|v| v.as_str())
                                .unwrap_or("unknown.pdf");
                            
                            // Determine classification
                            let document_type = if filename.contains("deed") {
                                "deed"
                            } else if filename.contains("survey") {
                                "survey"
                            } else if filename.contains("plat") {
                                "plat"
                            } else {
                                "unknown"
                            };
                            
                            // Create response
                            let classification = DocumentClassification {
                                document_type: document_type.to_string(),
                                confidence: 0.95,
                            };
                            
                            let response_data = serde_json::json!({
                                "success": true,
                                "classification": classification,
                                "filename": filename
                            });
                            
                            let response = Response::from_string(response_data.to_string())
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(200));
                            
                            if let Err(e) = request.respond(response) {
                                eprintln!("Error sending response: {}", e);
                            }
                        },
                        Err(e) => {
                            eprintln!("Error parsing document info: {}", e);
                            let response = Response::from_string(format!("{{\"error\": \"Failed to parse document info: {}\"}}", e))
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                                .with_status_code(StatusCode(400));
                            
                            if let Err(e) = request.respond(response) {
                                eprintln!("Error sending response: {}", e);
                            }
                        }
                    }
                },
                
                // Serve static files (index.html)
                (Method::Get, "/") => {
                    match File::open("benton_gis_rust/public/index.html") {
                        Ok(mut file) => {
                            let mut contents = String::new();
                            if let Err(e) = file.read_to_string(&mut contents) {
                                eprintln!("Error reading index.html: {}", e);
                                let response = Response::from_string("Internal Server Error")
                                    .with_status_code(StatusCode(500));
                                if let Err(e) = request.respond(response) {
                                    eprintln!("Error sending response: {}", e);
                                }
                                return;
                            }
                            
                            let response = Response::from_string(contents)
                                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap())
                                .with_status_code(StatusCode(200));
                            
                            if let Err(e) = request.respond(response) {
                                eprintln!("Error sending response: {}", e);
                            }
                        },
                        Err(e) => {
                            eprintln!("Error opening index.html: {}", e);
                            let response = Response::from_string("Not Found")
                                .with_status_code(StatusCode(404));
                            if let Err(e) = request.respond(response) {
                                eprintln!("Error sending response: {}", e);
                            }
                        }
                    }
                },
                
                // 404 Not Found for everything else
                _ => {
                    let response = Response::from_string("{\"error\": \"Not Found\"}")
                        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
                        .with_status_code(StatusCode(404));
                    
                    if let Err(e) = request.respond(response) {
                        eprintln!("Error sending response: {}", e);
                    }
                }
            }
        });
    }
}
