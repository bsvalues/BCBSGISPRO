use std::path::Path;
use std::sync::Arc;
use std::fs;
use std::env;
use tiny_http::Server;
use simple_logger::SimpleLogger;
use log::{info, warn, error, LevelFilter};

// Import our modules
mod models;
mod db;
mod web;

/// Main entry point for the Benton County GIS application
fn main() {
    // Initialize logger
    SimpleLogger::new()
        .with_level(LevelFilter::Info)
        .init()
        .expect("Failed to initialize logger");

    info!("Starting Benton County GIS application...");

    // Set up directories
    let uploads_dir = Path::new("uploads");
    if !uploads_dir.exists() {
        if let Err(e) = fs::create_dir_all(uploads_dir) {
            error!("Failed to create uploads directory: {}", e);
            return;
        }
    }
    
    let public_dir = Path::new("benton_gis_rust/public");
    if !public_dir.exists() {
        if let Err(e) = fs::create_dir_all(public_dir) {
            error!("Failed to create public directory: {}", e);
            return;
        }
    }

    // Initialize database
    let db_path = Path::new("benton_gis_rust/data/database.sqlite");
    let db_dir = db_path.parent().unwrap();
    if !db_dir.exists() {
        if let Err(e) = fs::create_dir_all(db_dir) {
            error!("Failed to create database directory: {}", e);
            return;
        }
    }
    
    let database = match db::DatabaseManager::new(db_path) {
        Ok(db) => Arc::new(db),
        Err(e) => {
            error!("Failed to initialize database: {}", e);
            return;
        }
    };
    
    // Get MapBox token from environment or use a placeholder
    let mapbox_token = env::var("MAPBOX_TOKEN").unwrap_or_else(|_| {
        warn!("MAPBOX_TOKEN not found in environment, using placeholder");
        "pk.placeholder_token_for_development".to_string()
    });
    
    // Set up HTTP server
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    info!("Starting server on http://{}", addr);
    
    // Create server
    let server = match Server::http(&addr) {
        Ok(server) => server,
        Err(e) => {
            error!("Failed to start server: {}", e);
            return;
        }
    };
    
    // Create web server and start handling requests
    let web_server = web::WebServer::new(
        server,
        database,
        public_dir.to_str().unwrap(),
        &mapbox_token
    );
    
    info!("Server started successfully! Listening for requests...");
    
    // Start handling requests (this will block the main thread)
    web_server.start();
}
