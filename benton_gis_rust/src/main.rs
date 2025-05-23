use aci_dev::{web, App, HttpServer, middleware, http};
use aci_dev::files as fs;
use std::env;
use std::path::Path;

mod web {
    pub mod routes {
        pub mod api;
        pub mod pages;
        pub mod websocket; // Add WebSocket support
    }
}

#[aci_dev::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();
    
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Get configuration from environment variables
    let bind_address = env::var("BIND_ADDRESS").unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    
    // Print startup information
    println!("🚀 Starting TerraFusion Platform (Rust with ACI.dev)");
    println!("===================================================");
    println!("📝 Server listening on: http://{}", bind_address);
    println!("🌐 Map Portal: http://localhost:8080/map");
    println!("📊 Dashboard: http://localhost:8080/dashboard");
    println!("📄 Documents: http://localhost:8080/documents");
    println!("⚙️ Workflows: http://localhost:8080/workflows");
    println!("📡 WebSocket API: ws://localhost:8080/ws");
    println!("===================================================");
    
    // Create data directory if it doesn't exist
    let data_dir = env::var("DATA_DIR").unwrap_or_else(|_| "./data".to_string());
    let documents_dir = Path::new(&data_dir).join("documents");
    if !documents_dir.exists() {
        println!("📂 Creating documents directory at: {:?}", documents_dir);
        std::fs::create_dir_all(&documents_dir)?;
    }
    
    // Start HTTP server with ACI.dev
    HttpServer::new(|| {
        App::new()
            // Middleware
            .wrap(middleware::Logger::default())
            
            // API Routes
            .service(
                web::scope("/api")
                    .configure(web::routes::api::configure)
            )
            
            // WebSocket support
            .service(
                web::scope("")
                    .configure(web::routes::websocket::configure)
            )
            
            // Static files
            .service(fs::Files::new("/static", "./static"))
            
            // Page routes
            .route("/", web::get().to(web::routes::pages::index))
            .route("/map", web::get().to(web::routes::pages::map))
            .route("/parcel/{id}", web::get().to(web::routes::pages::parcel_detail))
            .route("/documents", web::get().to(web::routes::pages::documents))
            .route("/workflows", web::get().to(web::routes::pages::workflows))
            .route("/dashboard", web::get().to(web::routes::pages::dashboard))
            
            // Default 404 handler
            .default_service(
                web::route()
                    .to(|| async {
                        aci_dev::HttpResponse::NotFound()
                            .content_type("text/html")
                            .body("<h1>404 - Page Not Found</h1><p>The requested resource was not found on the server.</p><p><a href=\"/\">Return to Home</a></p>")
                    })
            )
    })
    .bind(bind_address)?
    .run()
    .await
}