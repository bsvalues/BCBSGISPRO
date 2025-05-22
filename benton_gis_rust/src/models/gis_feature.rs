use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// GIS Feature model representing geographic entities in the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeature {
    /// Unique identifier for the feature
    pub id: Uuid,
    /// GeoJSON feature type
    pub feature_type: String,
    /// Properties associated with the feature
    pub properties: GisFeatureProperties,
    /// Geometry data in GeoJSON format
    pub geometry: GisFeatureGeometry,
    /// Timestamp when the feature was created
    pub created_at: DateTime<Utc>,
    /// Timestamp when the feature was last updated
    pub updated_at: DateTime<Utc>,
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
    /// Tax assessment data if applicable
    pub tax_data: Option<TaxData>,
    /// Additional properties stored as JSON
    #[serde(flatten)]
    pub additional_properties: std::collections::HashMap<String, serde_json::Value>,
}

/// Tax data associated with a parcel feature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxData {
    /// Assessed value of the property
    pub assessed_value: Option<f64>,
    /// Tax year for the assessment
    pub tax_year: Option<i32>,
    /// Tax rate applied to the property
    pub tax_rate: Option<f64>,
    /// Property class/type for tax purposes
    pub property_class: Option<String>,
}

/// GeoJSON geometry for a feature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisFeatureGeometry {
    /// GeoJSON geometry type
    pub geometry_type: String,
    /// Coordinates defining the geometry
    pub coordinates: serde_json::Value,
}

/// Collection of GIS features
#[derive(Debug, Serialize, Deserialize)]
pub struct GisFeatureCollection {
    /// Collection type (always "FeatureCollection" for GeoJSON)
    pub r#type: String,
    /// List of features in the collection
    pub features: Vec<GisFeature>,
}

impl GisFeatureCollection {
    /// Create a new empty feature collection
    pub fn new() -> Self {
        Self {
            r#type: "FeatureCollection".to_string(),
            features: Vec::new(),
        }
    }
}