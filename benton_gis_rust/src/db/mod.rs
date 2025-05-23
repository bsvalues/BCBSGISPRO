use rusqlite::{Connection, Result, params, NO_PARAMS};
use serde_json;
use std::path::Path;
use std::sync::Mutex;
use log::{info, error};

use crate::models::gis_feature::{GisFeature, GisFeatureProperties, GisFeatureGeometry};
use crate::models::document::{Document, DocumentMetadata, DocumentClassification};

pub struct DatabaseManager {
    connection: Mutex<Connection>,
}

impl DatabaseManager {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        info!("Initializing database at {:?}", db_path.as_ref());
        let connection = Connection::open(db_path)?;
        
        // Initialize database schema
        Self::initialize_schema(&connection)?;
        
        Ok(Self {
            connection: Mutex::new(connection),
        })
    }
    
    fn initialize_schema(connection: &Connection) -> Result<()> {
        info!("Initializing database schema");
        
        // Create GIS features table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS gis_features (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                properties TEXT NOT NULL,
                geometry TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )",
            NO_PARAMS,
        )?;
        
        // Create documents table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                classification TEXT,
                metadata TEXT NOT NULL,
                uploaded_at TEXT NOT NULL,
                uploaded_by TEXT
            )",
            NO_PARAMS,
        )?;
        
        // Create parcel documents relation table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS parcel_documents (
                parcel_id TEXT NOT NULL,
                document_id TEXT NOT NULL,
                PRIMARY KEY (parcel_id, document_id),
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )",
            NO_PARAMS,
        )?;
        
        Ok(())
    }
    
    pub fn get_connection(&self) -> Connection {
        self.connection.lock().unwrap().clone()
    }
}

// GIS Feature operations
pub fn save_gis_feature(conn: &Connection, feature: &GisFeature) -> Result<()> {
    // Serialize properties and geometry to JSON
    let properties_json = serde_json::to_string(&feature.properties)
        .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to serialize properties: {}", e)))?;
    
    let geometry_json = serde_json::to_string(&feature.geometry)
        .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to serialize geometry: {}", e)))?;
    
    // Check if feature already exists
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM gis_features WHERE id = ?1",
        params![feature.id],
        |row| row.get(0),
    )?;
    
    if count > 0 {
        // Update existing feature
        conn.execute(
            "UPDATE gis_features SET 
                type = ?1,
                properties = ?2,
                geometry = ?3,
                updated_at = ?4
             WHERE id = ?5",
            params![
                feature.type_name,
                properties_json,
                geometry_json,
                feature.updated_at.map(|dt| dt.to_rfc3339()),
                feature.id,
            ],
        )?;
    } else {
        // Insert new feature
        conn.execute(
            "INSERT INTO gis_features (id, type, properties, geometry, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                feature.id,
                feature.type_name,
                properties_json,
                geometry_json,
                feature.created_at.to_rfc3339(),
                feature.updated_at.map(|dt| dt.to_rfc3339()),
            ],
        )?;
    }
    
    Ok(())
}

pub fn get_gis_feature_by_id(conn: &Connection, id: &str) -> Result<Option<GisFeature>> {
    let mut stmt = conn.prepare(
        "SELECT id, type, properties, geometry, created_at, updated_at 
         FROM gis_features 
         WHERE id = ?1"
    )?;
    
    let feature_result = stmt.query_row(params![id], |row| {
        let id: String = row.get(0)?;
        let type_name: String = row.get(1)?;
        let properties_json: String = row.get(2)?;
        let geometry_json: String = row.get(3)?;
        let created_at: String = row.get(4)?;
        let updated_at: Option<String> = row.get(5)?;
        
        // Deserialize properties and geometry from JSON
        let properties: GisFeatureProperties = serde_json::from_str(&properties_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize properties: {}", e)))?;
        
        let geometry: GisFeatureGeometry = serde_json::from_str(&geometry_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize geometry: {}", e)))?;
        
        // Parse timestamps
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse created_at: {}", e)))?
            .with_timezone(&chrono::Utc);
        
        let updated_at = if let Some(dt) = updated_at {
            Some(chrono::DateTime::parse_from_rfc3339(&dt)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse updated_at: {}", e)))?
                .with_timezone(&chrono::Utc))
        } else {
            None
        };
        
        Ok(GisFeature {
            id,
            type_name,
            properties,
            geometry,
            created_at,
            updated_at,
        })
    });
    
    match feature_result {
        Ok(feature) => Ok(Some(feature)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn get_all_gis_features(conn: &Connection) -> Result<Vec<GisFeature>> {
    let mut stmt = conn.prepare(
        "SELECT id, type, properties, geometry, created_at, updated_at 
         FROM gis_features"
    )?;
    
    let feature_iter = stmt.query_map(NO_PARAMS, |row| {
        let id: String = row.get(0)?;
        let type_name: String = row.get(1)?;
        let properties_json: String = row.get(2)?;
        let geometry_json: String = row.get(3)?;
        let created_at: String = row.get(4)?;
        let updated_at: Option<String> = row.get(5)?;
        
        // Deserialize properties and geometry from JSON
        let properties: GisFeatureProperties = serde_json::from_str(&properties_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize properties: {}", e)))?;
        
        let geometry: GisFeatureGeometry = serde_json::from_str(&geometry_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize geometry: {}", e)))?;
        
        // Parse timestamps
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse created_at: {}", e)))?
            .with_timezone(&chrono::Utc);
        
        let updated_at = if let Some(dt) = updated_at {
            Some(chrono::DateTime::parse_from_rfc3339(&dt)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse updated_at: {}", e)))?
                .with_timezone(&chrono::Utc))
        } else {
            None
        };
        
        Ok(GisFeature {
            id,
            type_name,
            properties,
            geometry,
            created_at,
            updated_at,
        })
    })?;
    
    let mut features = Vec::new();
    for feature in feature_iter {
        features.push(feature?);
    }
    
    Ok(features)
}

// Document operations
pub fn save_document(conn: &Connection, document: &Document) -> Result<()> {
    // Serialize classification and metadata to JSON
    let classification_json = if let Some(ref classification) = document.classification {
        Some(serde_json::to_string(classification)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to serialize classification: {}", e)))?)
    } else {
        None
    };
    
    let metadata_json = serde_json::to_string(&document.metadata)
        .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to serialize metadata: {}", e)))?;
    
    // Check if document already exists
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM documents WHERE id = ?1",
        params![document.id],
        |row| row.get(0),
    )?;
    
    if count > 0 {
        // Update existing document
        conn.execute(
            "UPDATE documents SET 
                filename = ?1,
                content_type = ?2,
                file_size = ?3,
                file_path = ?4,
                classification = ?5,
                metadata = ?6,
                uploaded_by = ?7
             WHERE id = ?8",
            params![
                document.filename,
                document.content_type,
                document.file_size as i64,
                document.file_path,
                classification_json,
                metadata_json,
                document.uploaded_by,
                document.id,
            ],
        )?;
    } else {
        // Insert new document
        conn.execute(
            "INSERT INTO documents (id, filename, content_type, file_size, file_path, classification, metadata, uploaded_at, uploaded_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                document.id,
                document.filename,
                document.content_type,
                document.file_size as i64,
                document.file_path,
                classification_json,
                metadata_json,
                document.uploaded_at.to_rfc3339(),
                document.uploaded_by,
            ],
        )?;
    }
    
    // Update parcel-document relationships if parcel IDs are specified
    if let Some(ref parcel_ids) = document.metadata.parcel_ids {
        // First, remove existing relationships
        conn.execute(
            "DELETE FROM parcel_documents WHERE document_id = ?1",
            params![document.id],
        )?;
        
        // Then insert new relationships
        for parcel_id in parcel_ids {
            conn.execute(
                "INSERT INTO parcel_documents (parcel_id, document_id) VALUES (?1, ?2)",
                params![parcel_id, document.id],
            )?;
        }
    }
    
    Ok(())
}

pub fn get_document_by_id(conn: &Connection, id: &str) -> Result<Option<Document>> {
    let mut stmt = conn.prepare(
        "SELECT id, filename, content_type, file_size, file_path, classification, metadata, uploaded_at, uploaded_by 
         FROM documents 
         WHERE id = ?1"
    )?;
    
    let document_result = stmt.query_row(params![id], |row| {
        let id: String = row.get(0)?;
        let filename: String = row.get(1)?;
        let content_type: String = row.get(2)?;
        let file_size: i64 = row.get(3)?;
        let file_path: String = row.get(4)?;
        let classification_json: Option<String> = row.get(5)?;
        let metadata_json: String = row.get(6)?;
        let uploaded_at: String = row.get(7)?;
        let uploaded_by: Option<String> = row.get(8)?;
        
        // Deserialize classification and metadata from JSON
        let classification = if let Some(json) = classification_json {
            Some(serde_json::from_str::<DocumentClassification>(&json)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize classification: {}", e)))?)
        } else {
            None
        };
        
        let metadata = serde_json::from_str::<DocumentMetadata>(&metadata_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize metadata: {}", e)))?;
        
        // Parse timestamp
        let uploaded_at = chrono::DateTime::parse_from_rfc3339(&uploaded_at)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse uploaded_at: {}", e)))?
            .with_timezone(&chrono::Utc);
        
        Ok(Document {
            id,
            filename,
            content_type,
            file_size: file_size as usize,
            file_path,
            classification,
            metadata,
            uploaded_at,
            uploaded_by,
        })
    });
    
    match document_result {
        Ok(document) => Ok(Some(document)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn get_all_documents(conn: &Connection) -> Result<Vec<Document>> {
    let mut stmt = conn.prepare(
        "SELECT id, filename, content_type, file_size, file_path, classification, metadata, uploaded_at, uploaded_by 
         FROM documents"
    )?;
    
    let document_iter = stmt.query_map(NO_PARAMS, |row| {
        let id: String = row.get(0)?;
        let filename: String = row.get(1)?;
        let content_type: String = row.get(2)?;
        let file_size: i64 = row.get(3)?;
        let file_path: String = row.get(4)?;
        let classification_json: Option<String> = row.get(5)?;
        let metadata_json: String = row.get(6)?;
        let uploaded_at: String = row.get(7)?;
        let uploaded_by: Option<String> = row.get(8)?;
        
        // Deserialize classification and metadata from JSON
        let classification = if let Some(json) = classification_json {
            Some(serde_json::from_str::<DocumentClassification>(&json)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize classification: {}", e)))?)
        } else {
            None
        };
        
        let metadata = serde_json::from_str::<DocumentMetadata>(&metadata_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize metadata: {}", e)))?;
        
        // Parse timestamp
        let uploaded_at = chrono::DateTime::parse_from_rfc3339(&uploaded_at)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse uploaded_at: {}", e)))?
            .with_timezone(&chrono::Utc);
        
        Ok(Document {
            id,
            filename,
            content_type,
            file_size: file_size as usize,
            file_path,
            classification,
            metadata,
            uploaded_at,
            uploaded_by,
        })
    })?;
    
    let mut documents = Vec::new();
    for document in document_iter {
        documents.push(document?);
    }
    
    Ok(documents)
}

pub fn get_documents_by_parcel(conn: &Connection, parcel_id: &str) -> Result<Vec<Document>> {
    let mut stmt = conn.prepare(
        "SELECT d.id, d.filename, d.content_type, d.file_size, d.file_path, d.classification, d.metadata, d.uploaded_at, d.uploaded_by 
         FROM documents d
         JOIN parcel_documents pd ON d.id = pd.document_id
         WHERE pd.parcel_id = ?1"
    )?;
    
    let document_iter = stmt.query_map(params![parcel_id], |row| {
        let id: String = row.get(0)?;
        let filename: String = row.get(1)?;
        let content_type: String = row.get(2)?;
        let file_size: i64 = row.get(3)?;
        let file_path: String = row.get(4)?;
        let classification_json: Option<String> = row.get(5)?;
        let metadata_json: String = row.get(6)?;
        let uploaded_at: String = row.get(7)?;
        let uploaded_by: Option<String> = row.get(8)?;
        
        // Deserialize classification and metadata from JSON
        let classification = if let Some(json) = classification_json {
            Some(serde_json::from_str::<DocumentClassification>(&json)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize classification: {}", e)))?)
        } else {
            None
        };
        
        let metadata = serde_json::from_str::<DocumentMetadata>(&metadata_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize metadata: {}", e)))?;
        
        // Parse timestamp
        let uploaded_at = chrono::DateTime::parse_from_rfc3339(&uploaded_at)
            .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse uploaded_at: {}", e)))?
            .with_timezone(&chrono::Utc);
        
        Ok(Document {
            id,
            filename,
            content_type,
            file_size: file_size as usize,
            file_path,
            classification,
            metadata,
            uploaded_at,
            uploaded_by,
        })
    })?;
    
    let mut documents = Vec::new();
    for document in document_iter {
        documents.push(document?);
    }
    
    Ok(documents)
}