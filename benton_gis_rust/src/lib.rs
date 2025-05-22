// Export modules
pub mod models;
pub mod handlers;
pub mod services;
pub mod utils;

// Re-export common types
pub use models::gis_feature::{GisFeature, GisFeatureCollection};
pub use models::document::{Document, DocumentClassification};