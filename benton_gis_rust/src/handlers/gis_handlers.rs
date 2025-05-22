use actix_web::{web, HttpResponse, Responder};
use log::{info, error};
use uuid::Uuid;
use chrono::Utc;

use crate::models::gis_feature::{GisFeature, GisFeatureCollection, GisFeatureProperties, GisFeatureGeometry};

/// Get all GIS features
pub async fn get_features() -> impl Responder {
    info!("Fetching all GIS features");
    
    // In a real implementation, this would fetch from a database
    // For now, return an empty feature collection
    let feature_collection = GisFeatureCollection::new();
    
    HttpResponse::Ok().json(feature_collection)
}

/// Get a specific GIS feature by ID
pub async fn get_feature_by_id(path: web::Path<String>) -> impl Responder {
    let feature_id = path.into_inner();
    
    info!("Fetching GIS feature with ID: {}", feature_id);
    
    // Validate UUID format
    match Uuid::parse_str(&feature_id) {
        Ok(id) => {
            // In a real implementation, we would fetch the feature from the database
            // For now, return a placeholder feature
            
            // Create a mock feature for testing
            let feature = GisFeature {
                id,
                feature_type: "Feature".to_string(),
                properties: GisFeatureProperties {
                    name: Some("Sample Parcel".to_string()),
                    description: Some("A sample parcel for testing".to_string()),
                    parcel_number: Some("123456789".to_string()),
                    address: Some("123 Main St, Kennewick, WA".to_string()),
                    zoning: Some("Residential".to_string()),
                    tax_data: None,
                    additional_properties: std::collections::HashMap::new(),
                },
                geometry: GisFeatureGeometry {
                    geometry_type: "Polygon".to_string(),
                    coordinates: serde_json::json!([
                        [
                            [-119.2, 46.2],
                            [-119.2, 46.3],
                            [-119.1, 46.3],
                            [-119.1, 46.2],
                            [-119.2, 46.2]
                        ]
                    ]),
                },
                created_at: Utc::now(),
                updated_at: Utc::now(),
                created_by: Some("system".to_string()),
            };
            
            HttpResponse::Ok().json(feature)
        },
        Err(_) => {
            error!("Invalid UUID format: {}", feature_id);
            HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid feature ID format"
            }))
        }
    }
}

/// Create a new GIS feature
pub async fn create_feature(feature: web::Json<GisFeature>) -> impl Responder {
    info!("Creating new GIS feature");
    
    // In a real implementation, we would store this in a database
    // For now, just echo back the feature with a generated ID
    let mut new_feature = feature.into_inner();
    new_feature.id = Uuid::new_v4();
    new_feature.created_at = Utc::now();
    new_feature.updated_at = Utc::now();
    
    HttpResponse::Created().json(new_feature)
}

/// Update an existing GIS feature
pub async fn update_feature(
    path: web::Path<String>,
    feature: web::Json<GisFeature>,
) -> impl Responder {
    let feature_id = path.into_inner();
    
    info!("Updating GIS feature with ID: {}", feature_id);
    
    // Validate UUID format
    match Uuid::parse_str(&feature_id) {
        Ok(id) => {
            // In a real implementation, we would update the feature in the database
            // For now, just echo back the feature with the updated timestamp
            let mut updated_feature = feature.into_inner();
            updated_feature.id = id;
            updated_feature.updated_at = Utc::now();
            
            HttpResponse::Ok().json(updated_feature)
        },
        Err(_) => {
            error!("Invalid UUID format: {}", feature_id);
            HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid feature ID format"
            }))
        }
    }
}

/// Delete a GIS feature
pub async fn delete_feature(path: web::Path<String>) -> impl Responder {
    let feature_id = path.into_inner();
    
    info!("Deleting GIS feature with ID: {}", feature_id);
    
    // Validate UUID format
    match Uuid::parse_str(&feature_id) {
        Ok(_) => {
            // In a real implementation, we would delete the feature from the database
            HttpResponse::NoContent().finish()
        },
        Err(_) => {
            error!("Invalid UUID format: {}", feature_id);
            HttpResponse::BadRequest().json(serde_json::json!({
                "error": "Invalid feature ID format"
            }))
        }
    }
}