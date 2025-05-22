use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use actix_files as fs;
use actix_cors::Cors;
use std::env;
use std::collections::HashMap;
use log::{info, error};
use dotenv::dotenv;
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

// In-memory storage for demo
static mut FEATURES: Option<Vec<GisFeature>> = None;

// Basic health check endpoint
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "version": env!("CARGO_PKG_VERSION"),
        "service": "benton-gis"
    }))
}

// GET all GIS features
async fn get_features() -> impl Responder {
    let features = unsafe {
        if FEATURES.is_none() {
            FEATURES = Some(Vec::new());
        }
        FEATURES.as_ref().unwrap().clone()
    };

    HttpResponse::Ok().json(serde_json::json!({
        "type": "FeatureCollection",
        "features": features
    }))
}

// GET a specific GIS feature
async fn get_feature_by_id(path: web::Path<String>) -> impl Responder {
    let feature_id = path.into_inner();
    
    let features = unsafe {
        if FEATURES.is_none() {
            FEATURES = Some(Vec::new());
        }
        FEATURES.as_ref().unwrap().clone()
    };
    
    let feature = features.iter().find(|f| f.id == feature_id);
    
    match feature {
        Some(feature) => HttpResponse::Ok().json(feature),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Feature not found"
        }))
    }
}

// POST to create a new GIS feature
async fn create_feature(feature: web::Json<GisFeature>) -> impl Responder {
    let mut new_feature = feature.into_inner();
    new_feature.id = Uuid::new_v4().to_string();
    new_feature.created_at = Utc::now();
    
    unsafe {
        if FEATURES.is_none() {
            FEATURES = Some(Vec::new());
        }
        FEATURES.as_mut().unwrap().push(new_feature.clone());
    }
    
    HttpResponse::Created().json(new_feature)
}

// Document classification endpoint
async fn classify_document(doc_info: web::Json<serde_json::Value>) -> impl Responder {
    // This is a mock implementation for demo purposes
    let filename = doc_info.get("filename").and_then(|v| v.as_str()).unwrap_or("unknown.pdf");
    
    // Determine classification based on filename
    let document_type = if filename.contains("deed") {
        "deed"
    } else if filename.contains("survey") {
        "survey"
    } else if filename.contains("plat") {
        "plat"
    } else {
        "unknown"
    };
    
    let classification = DocumentClassification {
        document_type: document_type.to_string(),
        confidence: 0.95,
    };
    
    HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "classification": classification,
        "filename": filename
    }))
}

// Configure API routes
fn configure_api_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            // Health check endpoint
            .route("/health", web::get().to(health_check))
            
            // GIS feature endpoints
            .service(
                web::scope("/features")
                    .route("", web::get().to(get_features))
                    .route("", web::post().to(create_feature))
                    .route("/{id}", web::get().to(get_feature_by_id))
            )
            
            // Document management endpoints
            .service(
                web::scope("/documents")
                    .route("/classify", web::post().to(classify_document))
            )
    );
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from .env file if present
    dotenv().ok();
    
    // Initialize logger
    env_logger::init();
    
    // Set default port if not specified
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("0.0.0.0:{}", port);
    
    println!("Starting Benton County GIS Rust server on {}", bind_address);
    println!("API available at http://localhost:{}/api", port);
    
    // Create and start the HTTP server
    HttpServer::new(|| {
        // Configure CORS
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
            
        App::new()
            .wrap(cors)
            .configure(configure_api_routes)
            // Serve static frontend files from the public directory
            .service(fs::Files::new("/", "./public").index_file("index.html"))
    })
    .bind(bind_address)?
    .run()
    .await
}
