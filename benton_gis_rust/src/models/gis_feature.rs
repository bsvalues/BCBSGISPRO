use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// GIS Feature model representing geographic entities in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeature {
    /// Unique identifier for the feature
    pub id: String,
    /// GeoJSON feature type (typically "Feature")
    pub feature_type: String,
    /// Properties associated with the feature
    pub properties: GisFeatureProperties,
    /// Geometry data in GeoJSON format
    pub geometry: GisFeatureGeometry,
    /// Timestamp when the feature was created
    pub created_at: DateTime<Utc>,
    /// Timestamp when the feature was last updated
    pub updated_at: Option<DateTime<Utc>>,
    /// User who created this feature
    pub created_by: Option<String>,
}

/// Properties associated with a GIS feature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeatureProperties {
    /// Name of the feature
    pub name: Option<String>,
    /// Description of the feature
    pub description: Option<String>,
    /// Parcel number if applicable
    pub parcel_number: Option<String>,
    /// Address information if applicable
    pub address: Option<String>,
    /// Zoning classification if applicable
    pub zoning: Option<String>,
    /// Additional properties stored as JSON
    #[serde(flatten)]
    pub additional_properties: HashMap<String, serde_json::Value>,
}

/// GeoJSON geometry for a feature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeatureGeometry {
    /// GeoJSON geometry type (Point, LineString, Polygon, etc.)
    #[serde(rename = "type")]
    pub geometry_type: String,
    /// Coordinates defining the geometry
    pub coordinates: serde_json::Value,
}

/// Collection of GIS features
#[derive(Debug, Serialize, Deserialize)]
pub struct GisFeatureCollection {
    /// Collection type (always "FeatureCollection" for GeoJSON)
    #[serde(rename = "type")]
    pub type_name: String,
    /// List of features in the collection
    pub features: Vec<GisFeature>,
}

impl GisFeatureCollection {
    /// Create a new empty feature collection
    pub fn new() -> Self {
        Self {
            type_name: "FeatureCollection".to_string(),
            features: Vec::new(),
        }
    }
    
    /// Add a feature to the collection
    pub fn add_feature(&mut self, feature: GisFeature) {
        self.features.push(feature);
    }
    
    /// Get the number of features in the collection
    pub fn count(&self) -> usize {
        self.features.len()
    }
}

impl GisFeature {
    /// Create a new feature with minimal required information
    pub fn new(feature_type: &str, properties: GisFeatureProperties, geometry: GisFeatureGeometry) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            feature_type: feature_type.to_string(),
            properties,
            geometry,
            created_at: Utc::now(),
            updated_at: None,
            created_by: None,
        }
    }
    
    /// Update a feature's properties
    pub fn update_properties(&mut self, properties: GisFeatureProperties) {
        self.properties = properties;
        self.updated_at = Some(Utc::now());
    }
    
    /// Update a feature's geometry
    pub fn update_geometry(&mut self, geometry: GisFeatureGeometry) {
        self.geometry = geometry;
        self.updated_at = Some(Utc::now());
    }
}