use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::env;
use log::{info, error};
use chrono::Utc;
use std::collections::HashMap;

use crate::models::gis_feature::{GisFeature, GisFeatureProperties, GisFeatureGeometry, GisFeatureCollection};

const BENTON_COUNTY_ARCGIS_URL: &str = "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services";

#[derive(Debug, Serialize, Deserialize)]
pub struct ArcGisQueryResponse {
    #[serde(rename = "objectIdFieldName")]
    pub object_id_field_name: Option<String>,
    #[serde(rename = "globalIdFieldName")]
    pub global_id_field_name: Option<String>,
    pub features: Vec<ArcGisFeature>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArcGisFeature {
    pub attributes: HashMap<String, serde_json::Value>,
    pub geometry: ArcGisGeometry,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArcGisGeometry {
    pub rings: Option<Vec<Vec<Vec<f64>>>>,
    pub paths: Option<Vec<Vec<Vec<f64>>>>,
    pub points: Option<Vec<Vec<f64>>>,
    #[serde(rename = "x")]
    pub x_coord: Option<f64>,
    #[serde(rename = "y")]
    pub y_coord: Option<f64>,
}

pub struct ArcGisClient {
    client: Client,
    api_key: String,
}

impl ArcGisClient {
    pub fn new() -> Self {
        let api_key = env::var("ARCGIS_API_KEY").unwrap_or_else(|_| String::from(""));
        Self {
            client: Client::new(),
            api_key,
        }
    }

    pub async fn get_parcels(&self, bounds: Option<[f64; 4]>) -> Result<GisFeatureCollection, String> {
        info!("Fetching parcels from Benton County ArcGIS");
        
        // Construct query parameters
        let mut params = vec![
            ("f", "json".to_string()),
            ("outFields", "*".to_string()),
            ("where", "1=1".to_string()),
        ];

        if let Some(bbox) = bounds {
            params.push(("geometry", format!("{},{},{},{}", bbox[0], bbox[1], bbox[2], bbox[3])));
            params.push(("geometryType", "esriGeometryEnvelope".to_string()));
            params.push(("spatialRel", "esriSpatialRelIntersects".to_string()));
        }

        // Add API key if available
        if !self.api_key.is_empty() {
            params.push(("token", self.api_key.clone()));
        }

        // Build URL for parcel layer
        let url = format!("{}/Parcels/FeatureServer/0/query", BENTON_COUNTY_ARCGIS_URL);
        
        // Execute query
        let response = self.client.get(&url)
            .query(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to query ArcGIS API: {}", e))?;
        
        // Check response status
        if !response.status().is_success() {
            let error_text = response.text().await
                .unwrap_or_else(|_| String::from("Unknown error"));
            return Err(format!("ArcGIS API returned error: {}", error_text));
        }
        
        // Parse response
        let arcgis_response: ArcGisQueryResponse = response.json()
            .await
            .map_err(|e| format!("Failed to parse ArcGIS response: {}", e))?;
        
        // Convert ArcGIS features to GIS features
        let mut features = Vec::new();
        for arcgis_feature in arcgis_response.features {
            // Extract parcel properties
            let mut properties = GisFeatureProperties::new();
            
            // Map common parcel fields
            if let Some(parcel_num) = arcgis_feature.attributes.get("PARCEL_NUM") {
                if let Some(parcel_num) = parcel_num.as_str() {
                    properties.parcel_number = Some(parcel_num.to_string());
                }
            }
            
            if let Some(address) = arcgis_feature.attributes.get("SITUS") {
                if let Some(address) = address.as_str() {
                    properties.address = Some(address.to_string());
                }
            }
            
            if let Some(zoning) = arcgis_feature.attributes.get("ZONE_CODE") {
                if let Some(zoning) = zoning.as_str() {
                    properties.zoning = Some(zoning.to_string());
                }
            }
            
            // Store all attributes in additional_properties
            for (key, value) in &arcgis_feature.attributes {
                properties.additional_properties.insert(key.clone(), value.clone());
            }
            
            // Create geometry
            let geometry = GisFeatureGeometry::new(
                "Polygon",
                serde_json::to_value(&arcgis_feature.geometry.rings)
                    .unwrap_or_else(|_| serde_json::Value::Null),
            );
            
            // Create GIS feature
            let feature = GisFeature::new("parcel", properties, geometry);
            features.push(feature);
        }
        
        Ok(GisFeatureCollection::new(features))
    }

    pub async fn get_zoning(&self, bounds: Option<[f64; 4]>) -> Result<GisFeatureCollection, String> {
        info!("Fetching zoning from Benton County ArcGIS");
        
        // Construct query parameters
        let mut params = vec![
            ("f", "json".to_string()),
            ("outFields", "*".to_string()),
            ("where", "1=1".to_string()),
        ];

        if let Some(bbox) = bounds {
            params.push(("geometry", format!("{},{},{},{}", bbox[0], bbox[1], bbox[2], bbox[3])));
            params.push(("geometryType", "esriGeometryEnvelope".to_string()));
            params.push(("spatialRel", "esriSpatialRelIntersects".to_string()));
        }

        // Add API key if available
        if !self.api_key.is_empty() {
            params.push(("token", self.api_key.clone()));
        }

        // Build URL for zoning layer
        let url = format!("{}/Zoning/FeatureServer/0/query", BENTON_COUNTY_ARCGIS_URL);
        
        // Execute query
        let response = self.client.get(&url)
            .query(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to query ArcGIS API: {}", e))?;
        
        // Check response status
        if !response.status().is_success() {
            let error_text = response.text().await
                .unwrap_or_else(|_| String::from("Unknown error"));
            return Err(format!("ArcGIS API returned error: {}", error_text));
        }
        
        // Parse response
        let arcgis_response: ArcGisQueryResponse = response.json()
            .await
            .map_err(|e| format!("Failed to parse ArcGIS response: {}", e))?;
        
        // Convert ArcGIS features to GIS features
        let mut features = Vec::new();
        for arcgis_feature in arcgis_response.features {
            // Extract zoning properties
            let mut properties = GisFeatureProperties::new();
            
            // Map common zoning fields
            if let Some(zone_code) = arcgis_feature.attributes.get("ZONE_CODE") {
                if let Some(zone_code) = zone_code.as_str() {
                    properties.name = Some(zone_code.to_string());
                }
            }
            
            if let Some(description) = arcgis_feature.attributes.get("DESCRIPTION") {
                if let Some(description) = description.as_str() {
                    properties.description = Some(description.to_string());
                }
            }
            
            // Store all attributes in additional_properties
            for (key, value) in &arcgis_feature.attributes {
                properties.additional_properties.insert(key.clone(), value.clone());
            }
            
            // Create geometry
            let geometry = GisFeatureGeometry::new(
                "Polygon",
                serde_json::to_value(&arcgis_feature.geometry.rings)
                    .unwrap_or_else(|_| serde_json::Value::Null),
            );
            
            // Create GIS feature
            let feature = GisFeature::new("zoning", properties, geometry);
            features.push(feature);
        }
        
        Ok(GisFeatureCollection::new(features))
    }

    pub async fn get_feature_by_parcel_id(&self, parcel_id: &str) -> Result<Option<GisFeature>, String> {
        info!("Fetching parcel by ID: {}", parcel_id);
        
        // Construct query parameters
        let params = vec![
            ("f", "json".to_string()),
            ("outFields", "*".to_string()),
            ("where", format!("PARCEL_NUM='{}'", parcel_id)),
        ];

        // Build URL for parcel layer
        let url = format!("{}/Parcels/FeatureServer/0/query", BENTON_COUNTY_ARCGIS_URL);
        
        // Execute query
        let response = self.client.get(&url)
            .query(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to query ArcGIS API: {}", e))?;
        
        // Check response status
        if !response.status().is_success() {
            let error_text = response.text().await
                .unwrap_or_else(|_| String::from("Unknown error"));
            return Err(format!("ArcGIS API returned error: {}", error_text));
        }
        
        // Parse response
        let arcgis_response: ArcGisQueryResponse = response.json()
            .await
            .map_err(|e| format!("Failed to parse ArcGIS response: {}", e))?;
        
        // Return first matching feature
        if let Some(arcgis_feature) = arcgis_response.features.first() {
            // Extract parcel properties
            let mut properties = GisFeatureProperties::new();
            
            // Map common parcel fields
            properties.parcel_number = Some(parcel_id.to_string());
            
            if let Some(address) = arcgis_feature.attributes.get("SITUS") {
                if let Some(address) = address.as_str() {
                    properties.address = Some(address.to_string());
                }
            }
            
            if let Some(zoning) = arcgis_feature.attributes.get("ZONE_CODE") {
                if let Some(zoning) = zoning.as_str() {
                    properties.zoning = Some(zoning.to_string());
                }
            }
            
            // Store all attributes in additional_properties
            for (key, value) in &arcgis_feature.attributes {
                properties.additional_properties.insert(key.clone(), value.clone());
            }
            
            // Create geometry
            let geometry = GisFeatureGeometry::new(
                "Polygon",
                serde_json::to_value(&arcgis_feature.geometry.rings)
                    .unwrap_or_else(|_| serde_json::Value::Null),
            );
            
            // Create GIS feature
            let feature = GisFeature::new("parcel", properties, geometry);
            return Ok(Some(feature));
        }
        
        Ok(None)
    }
}