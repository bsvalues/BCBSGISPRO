use actix_web::{web, App, HttpServer, middleware, HttpResponse};
use actix_files as fs;
use std::io;
use rusqlite::Connection;
use std::sync::Arc;
use log::{info, error};

use benton_gis::db::DatabaseManager;
use benton_gis::integrations::document_manager::DocumentManager;
use benton_gis::integrations::workflow::WorkflowManager;
use benton_gis::integrations::arcgis::ArcGisClient;
use benton_gis::web::routes;
use benton_gis::{initialize, get_db_path, get_document_storage_path};

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Initialize application
    initialize();
    
    // Get database and document paths
    let db_path = get_db_path();
    let document_path = get_document_storage_path();
    
    // Initialize database connection
    let db_conn = match Connection::open(&db_path) {
        Ok(conn) => conn,
        Err(e) => {
            error!("Failed to open database: {}", e);
            return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to open database: {}", e)));
        }
    };
    
    // Initialize database manager
    let db_manager = match DatabaseManager::new(&db_path) {
        Ok(manager) => Arc::new(manager),
        Err(e) => {
            error!("Failed to initialize database manager: {}", e);
            return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to initialize database manager: {}", e)));
        }
    };
    
    // Initialize document manager
    let document_manager = Arc::new(DocumentManager::new(&document_path, db_conn.clone()));
    
    // Initialize workflow manager
    let workflow_manager = match WorkflowManager::new(db_conn.clone()) {
        Ok(manager) => Arc::new(manager),
        Err(e) => {
            error!("Failed to initialize workflow manager: {}", e);
            return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to initialize workflow manager: {}", e)));
        }
    };
    
    // Initialize ArcGIS client
    let arcgis_client = Arc::new(ArcGisClient::new());
    
    // Create data object to be shared with all routes
    let app_data = web::Data::new(AppState {
        db_manager: db_manager.clone(),
        document_manager: document_manager.clone(),
        workflow_manager: workflow_manager.clone(),
        arcgis_client: arcgis_client.clone(),
    });

    // Start HTTP server
    let bind_address = "0.0.0.0:8080";
    info!("Starting server at {}", bind_address);
    
    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .app_data(app_data.clone())
            // API routes
            .service(web::scope("/api")
                .configure(routes::api::configure))
            // Static files and templated pages
            .service(fs::Files::new("/static", "./static").show_files_listing(false))
            .service(web::resource("/").to(routes::pages::index))
            .service(web::resource("/map").to(routes::pages::map))
            .service(web::resource("/parcels/{id}").to(routes::pages::parcel_detail))
            .service(web::resource("/documents").to(routes::pages::documents))
            .service(web::resource("/workflows").to(routes::pages::workflows))
            .service(web::resource("/dashboard").to(routes::pages::dashboard))
            // 404 handler
            .default_service(web::route().to(|| async {
                HttpResponse::NotFound().body("Not Found")
            }))
    })
    .bind(bind_address)?
    .run()
    .await
}

/// Shared application state to be passed to route handlers
pub struct AppState {
    pub db_manager: Arc<DatabaseManager>,
    pub document_manager: Arc<DocumentManager>,
    pub workflow_manager: Arc<WorkflowManager>,
    pub arcgis_client: Arc<ArcGisClient>,
}