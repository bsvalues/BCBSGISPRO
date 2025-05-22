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
mod integrations;

/// Main entry point for the Benton County GIS application
fn main() {
    // Initialize logger
    SimpleLogger::new()
        .with_level(LevelFilter::Info)
        .init()
        .expect("Failed to initialize logger");

    info!("Starting TerraFusion Platform for Benton County...");

    // Set up data directories for real county data
    let data_dir = Path::new("data");
    if !data_dir.exists() {
        if let Err(e) = fs::create_dir_all(data_dir) {
            error!("Failed to create data directory: {}", e);
            return;
        }
    }
    
    // Set up directories for document storage
    let uploads_dir = Path::new("uploads");
    if !uploads_dir.exists() {
        if let Err(e) = fs::create_dir_all(uploads_dir) {
            error!("Failed to create uploads directory: {}", e);
            return;
        }
    }
    
    // Set up directory for web assets
    let public_dir = Path::new("benton_gis_rust/public");
    if !public_dir.exists() {
        if let Err(e) = fs::create_dir_all(public_dir) {
            error!("Failed to create public directory: {}", e);
            return;
        }
    }

    // Initialize database for local storage
    let db_path = Path::new("data/database.sqlite");
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
    
    // Initialize document management system
    match integrations::document_manager::initialize_document_system() {
        Ok(_) => info!("Document system initialized successfully"),
        Err(e) => error!("Failed to initialize document system: {}", e),
    }
    
    // Initialize workflow management system
    match integrations::workflow::initialize_workflow_system() {
        Ok(_) => info!("Workflow system initialized successfully"),
        Err(e) => error!("Failed to initialize workflow system: {}", e),
    }
    
    // Get MapBox token from environment
    let mapbox_token = env::var("MAPBOX_TOKEN").unwrap_or_else(|_| {
        warn!("MAPBOX_TOKEN not found in environment. For live map data, please provide a valid MapBox API token.");
        // We don't use a placeholder - we want to show a proper error to encourage real data usage
        "".to_string()
    });
    
    // Get ArcGIS token for accessing real Benton County GIS data
    let arcgis_token = env::var("ARCGIS_TOKEN").unwrap_or_else(|_| {
        warn!("ARCGIS_TOKEN not found in environment. For real Benton County data, please provide a valid ArcGIS API token.");
        // We don't use a placeholder - we want to show a proper error to encourage real data usage
        "".to_string()
    });
    
    // Set up HTTP server
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    info!("Starting TerraFusion web server on http://{}", addr);
    
    // Create server
    let server = match Server::http(&addr) {
        Ok(server) => server,
        Err(e) => {
            error!("Failed to start server: {}", e);
            return;
        }
    };
    
    // Create web server configuration
    let web_config = web::WebServerConfig {
        database: database.clone(),
        public_dir: public_dir.to_str().unwrap().to_string(),
        mapbox_token: mapbox_token.clone(),
        arcgis_token: arcgis_token.clone(),
        use_real_data: true,  // Always use real data, never fallback to mock data
    };
    
    // Create web server and start handling requests
    let web_server = web::WebServer::new(server, web_config);
    
    info!("TerraFusion Platform started successfully!");
    info!("Using real Benton County GIS data sources");
    info!("Listening for requests on http://{}", addr);
    
    // Start handling requests (this will block the main thread)
    web_server.start();
}
