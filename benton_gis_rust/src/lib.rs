pub mod models;
pub mod db;
pub mod integrations;
pub mod web;

use log::info;
use dotenv::dotenv;
use std::env;
use std::path::Path;

pub fn initialize() {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logging
    if env::var("RUST_LOG").is_err() {
        env::set_var("RUST_LOG", "info");
    }
    env_logger::init();
    
    info!("TerraFusion Platform initializing...");
}

pub fn get_data_dir() -> String {
    env::var("DATA_DIR").unwrap_or_else(|_| "./data".to_string())
}

pub fn get_db_path() -> String {
    let data_dir = get_data_dir();
    Path::new(&data_dir).join("benton_gis.db").to_string_lossy().to_string()
}

pub fn get_document_storage_path() -> String {
    let data_dir = get_data_dir();
    Path::new(&data_dir).join("documents").to_string_lossy().to_string()
}