use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use log::{info, error};
use crate::models::gis_feature::{GisFeature, GisFeatureProperties, GisFeatureGeometry};

// ArcGIS REST API URLs for Benton County
const ARCGIS_BASE_URL: &str = "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services";
const PARCELS_LAYER_URL: &str = "/Parcels/FeatureServer/0";
const ZONING_LAYER_URL: &str = "/Zoning/FeatureServer/0";
const ROADS_LAYER_URL: &str = "/Roads/FeatureServer/0";

// ArcGIS Feature Response structure
#[derive(Debug, Deserialize)]
pub struct ArcGisResponse {
    #[serde(rename = "features")]
    pub features: Vec<ArcGisFeature>,
}

#[derive(Debug, Deserialize)]
pub struct ArcGisFeature {
    pub attributes: HashMap<String, serde_json::Value>,
    pub geometry: ArcGisGeometry,
}

#[derive(Debug, Deserialize)]
pub struct ArcGisGeometry {
    pub rings: Option<Vec<Vec<Vec<f64>>>>,  // For polygons
    pub paths: Option<Vec<Vec<Vec<f64>>>>,  // For polylines
    pub points: Option<Vec<Vec<f64>>>,      // For points
    pub x: Option<f64>,                     // For point
    pub y: Option<f64>,                     // For point
}

// Query parameters for ArcGIS REST API
#[derive(Debug, Serialize)]
pub struct ArcGisQueryParams {
    pub where_clause: String,
    pub outFields: String,
    pub returnGeometry: bool,
    pub f: String,
}

impl Default for ArcGisQueryParams {
    fn default() -> Self {
        Self {
            where_clause: "1=1".to_string(),  // Get all features
            outFields: "*".to_string(),       // Get all fields
            returnGeometry: true,
            f: "json".to_string(),
        }
    }
}

// Function to fetch parcel data from ArcGIS
pub async fn fetch_parcels(query_params: Option<ArcGisQueryParams>) -> Result<Vec<GisFeature>, Box<dyn Error>> {
    let params = query_params.unwrap_or_default();
    let url = format!("{}{}/query", ARCGIS_BASE_URL, PARCELS_LAYER_URL);
    
    info!("Fetching parcels from ArcGIS: {}", url);
    
    // Build query string
    let query = serde_qs::to_string(&params)?;
    let request_url = format!("{}?{}", url, query);
    
    // Make HTTP request to ArcGIS REST API
    let response = reqwest::get(&request_url).await?;
    
    if !response.status().is_success() {
        error!("Failed to fetch parcels: HTTP {}", response.status());
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    // Parse response
    let arcgis_response: ArcGisResponse = response.json().await?;
    
    // Convert ArcGIS features to our GisFeature model
    let features = arcgis_response.features.into_iter()
        .map(|feature| {
            let id = match feature.attributes.get("OBJECTID") {
                Some(serde_json::Value::Number(n)) => n.to_string(),
                _ => uuid::Uuid::new_v4().to_string(),
            };
            
            // Extract properties
            let properties = GisFeatureProperties {
                name: feature.attributes.get("NAME").and_then(|v| v.as_str().map(String::from)),
                description: None,
                parcel_number: feature.attributes.get("PARCEL_NUM").and_then(|v| v.as_str().map(String::from)),
                address: feature.attributes.get("SITUS").and_then(|v| v.as_str().map(String::from)),
                zoning: feature.attributes.get("ZONING").and_then(|v| v.as_str().map(String::from)),
                additional_properties: feature.attributes,
            };
            
            // Convert geometry to GeoJSON format
            let geometry = convert_arcgis_geometry_to_geojson(&feature.geometry);
            
            GisFeature::new("Feature", properties, geometry)
        })
        .collect();
    
    Ok(features)
}

// Function to fetch zoning data from ArcGIS
pub async fn fetch_zoning(query_params: Option<ArcGisQueryParams>) -> Result<Vec<GisFeature>, Box<dyn Error>> {
    let params = query_params.unwrap_or_default();
    let url = format!("{}{}/query", ARCGIS_BASE_URL, ZONING_LAYER_URL);
    
    info!("Fetching zoning from ArcGIS: {}", url);
    
    // Build query string
    let query = serde_qs::to_string(&params)?;
    let request_url = format!("{}?{}", url, query);
    
    // Make HTTP request to ArcGIS REST API
    let response = reqwest::get(&request_url).await?;
    
    if !response.status().is_success() {
        error!("Failed to fetch zoning: HTTP {}", response.status());
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    // Parse response
    let arcgis_response: ArcGisResponse = response.json().await?;
    
    // Convert ArcGIS features to our GisFeature model
    let features = arcgis_response.features.into_iter()
        .map(|feature| {
            let id = match feature.attributes.get("OBJECTID") {
                Some(serde_json::Value::Number(n)) => n.to_string(),
                _ => uuid::Uuid::new_v4().to_string(),
            };
            
            // Extract properties
            let properties = GisFeatureProperties {
                name: feature.attributes.get("ZONE_TYPE").and_then(|v| v.as_str().map(String::from)),
                description: feature.attributes.get("DESCRIPTION").and_then(|v| v.as_str().map(String::from)),
                parcel_number: None,
                address: None,
                zoning: feature.attributes.get("ZONE_CODE").and_then(|v| v.as_str().map(String::from)),
                additional_properties: feature.attributes,
            };
            
            // Convert geometry to GeoJSON format
            let geometry = convert_arcgis_geometry_to_geojson(&feature.geometry);
            
            GisFeature::new("Feature", properties, geometry)
        })
        .collect();
    
    Ok(features)
}

// Function to fetch road data from ArcGIS
pub async fn fetch_roads(query_params: Option<ArcGisQueryParams>) -> Result<Vec<GisFeature>, Box<dyn Error>> {
    let params = query_params.unwrap_or_default();
    let url = format!("{}{}/query", ARCGIS_BASE_URL, ROADS_LAYER_URL);
    
    info!("Fetching roads from ArcGIS: {}", url);
    
    // Build query string
    let query = serde_qs::to_string(&params)?;
    let request_url = format!("{}?{}", url, query);
    
    // Make HTTP request to ArcGIS REST API
    let response = reqwest::get(&request_url).await?;
    
    if !response.status().is_success() {
        error!("Failed to fetch roads: HTTP {}", response.status());
        return Err(format!("HTTP error: {}", response.status()).into());
    }
    
    // Parse response
    let arcgis_response: ArcGisResponse = response.json().await?;
    
    // Convert ArcGIS features to our GisFeature model
    let features = arcgis_response.features.into_iter()
        .map(|feature| {
            let id = match feature.attributes.get("OBJECTID") {
                Some(serde_json::Value::Number(n)) => n.to_string(),
                _ => uuid::Uuid::new_v4().to_string(),
            };
            
            // Extract properties
            let properties = GisFeatureProperties {
                name: feature.attributes.get("STREET_NAME").and_then(|v| v.as_str().map(String::from)),
                description: None,
                parcel_number: None,
                address: None,
                zoning: None,
                additional_properties: feature.attributes,
            };
            
            // Convert geometry to GeoJSON format
            let geometry = convert_arcgis_geometry_to_geojson(&feature.geometry);
            
            GisFeature::new("Feature", properties, geometry)
        })
        .collect();
    
    Ok(features)
}

// Helper function to convert ArcGIS geometry to GeoJSON format
fn convert_arcgis_geometry_to_geojson(geometry: &ArcGisGeometry) -> GisFeatureGeometry {
    // Check geometry type and convert accordingly
    if let Some(rings) = &geometry.rings {
        // Polygon
        GisFeatureGeometry {
            geometry_type: "Polygon".to_string(),
            coordinates: serde_json::to_value(rings).unwrap_or(serde_json::Value::Null),
        }
    } else if let Some(paths) = &geometry.paths {
        // LineString
        GisFeatureGeometry {
            geometry_type: "LineString".to_string(),
            coordinates: serde_json::to_value(paths).unwrap_or(serde_json::Value::Null),
        }
    } else if let Some(points) = &geometry.points {
        // MultiPoint
        GisFeatureGeometry {
            geometry_type: "MultiPoint".to_string(),
            coordinates: serde_json::to_value(points).unwrap_or(serde_json::Value::Null),
        }
    } else if let (Some(x), Some(y)) = (geometry.x, geometry.y) {
        // Point
        GisFeatureGeometry {
            geometry_type: "Point".to_string(),
            coordinates: serde_json::to_value([x, y]).unwrap_or(serde_json::Value::Null),
        }
    } else {
        // Unknown geometry type
        GisFeatureGeometry {
            geometry_type: "Unknown".to_string(),
            coordinates: serde_json::Value::Null,
        }
    }
}