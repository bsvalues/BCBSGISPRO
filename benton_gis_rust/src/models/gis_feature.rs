use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeature {
    pub id: String,
    pub type_name: String,
    pub properties: GisFeatureProperties,
    pub geometry: GisFeatureGeometry,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeatureProperties {
    pub name: Option<String>,
    pub description: Option<String>,
    pub parcel_number: Option<String>,
    pub address: Option<String>,
    pub zoning: Option<String>,
    #[serde(flatten)]
    pub additional_properties: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeatureGeometry {
    #[serde(rename = "type")]
    pub geometry_type: String,
    pub coordinates: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeatureCollection {
    #[serde(rename = "type")]
    pub type_name: String,
    pub features: Vec<GisFeature>,
}

impl GisFeature {
    pub fn new(type_name: &str, properties: GisFeatureProperties, geometry: GisFeatureGeometry) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            type_name: type_name.to_string(),
            properties,
            geometry,
            created_at: Utc::now(),
            updated_at: None,
        }
    }
}

impl GisFeatureProperties {
    pub fn new() -> Self {
        Self {
            name: None,
            description: None,
            parcel_number: None,
            address: None,
            zoning: None,
            additional_properties: HashMap::new(),
        }
    }
}

impl GisFeatureGeometry {
    pub fn new(geometry_type: &str, coordinates: serde_json::Value) -> Self {
        Self {
            geometry_type: geometry_type.to_string(),
            coordinates,
        }
    }
}

impl GisFeatureCollection {
    pub fn new(features: Vec<GisFeature>) -> Self {
        Self {
            type_name: "FeatureCollection".to_string(),
            features,
        }
    }
}