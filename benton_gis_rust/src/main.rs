use actix_web::{web, App, HttpServer, HttpResponse, Responder};
use actix_files as fs;
use actix_cors::Cors;
use std::env;
use log::{info, error};
use dotenv::dotenv;

// Basic health check endpoint
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "version": env!("CARGO_PKG_VERSION"),
        "service": "benton-gis"
    }))
}

// Placeholder API endpoint for GIS data
async fn get_gis_features() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "features": [],
        "type": "FeatureCollection",
        "message": "GIS features endpoint placeholder"
    }))
}

// Document classification endpoint placeholder
async fn classify_document() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "classification": "deed",
        "confidence": 0.95,
        "message": "Document classification endpoint placeholder"
    }))
}

// Configure API routes
fn configure_api_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .route("/health", web::get().to(health_check))
            .route("/features", web::get().to(get_gis_features))
            .route("/documents/classify", web::post().to(classify_document))
    );
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from .env file if present
    dotenv().ok();
    
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));
    
    // Set default port if not specified
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("0.0.0.0:{}", port);
    
    info!("Starting Benton GIS Rust server on {}", bind_address);
    
    // Create and start the HTTP server
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
            
        App::new()
            .wrap(cors)
            .configure(configure_api_routes)
            // Serve static files from the public directory
            .service(fs::Files::new("/", "./public").index_file("index.html"))
    })
    .bind(bind_address)?
    .run()
    .await
}
