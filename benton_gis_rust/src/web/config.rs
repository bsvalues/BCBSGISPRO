use std::sync::Arc;
use crate::db::DatabaseManager;

/// Configuration for the web server
pub struct WebServerConfig {
    /// Database manager for storage operations
    pub database: Arc<DatabaseManager>,
    
    /// Directory for serving static files
    pub public_dir: String,
    
    /// MapBox API token for interactive maps
    pub mapbox_token: String,
    
    /// ArcGIS API token for accessing Benton County GIS data
    pub arcgis_token: String,
    
    /// Flag for using real data (should always be true)
    pub use_real_data: bool,
}