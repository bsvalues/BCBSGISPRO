use rusqlite::{Connection, Result as SqlResult, params};
use crate::models::gis_feature::{GisFeature, GisFeatureProperties, GisFeatureGeometry};
use crate::models::document::{Document, DocumentMetadata, DocumentClassification};
use std::sync::{Arc, Mutex};
use log::{info, error};

/// Save a GIS feature to the database
pub fn save_gis_feature(conn: &Arc<Mutex<Connection>>, feature: &GisFeature) -> SqlResult<()> {
    let conn = conn.lock().unwrap();
    
    // Serialize JSON fields
    let properties_json = serde_json::to_string(&feature.properties)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
    
    let geometry_json = serde_json::to_string(&feature.geometry)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
    
    // Insert into database
    conn.execute(
        "INSERT INTO gis_features (
            id, feature_type, properties, geometry, 
            created_at, updated_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params![
            feature.id,
            feature.feature_type,
            properties_json,
            geometry_json,
            feature.created_at.to_rfc3339(),
            feature.updated_at.map(|dt| dt.to_rfc3339()),
            feature.created_by,
        ],
    )?;
    
    info!("Saved GIS feature with ID: {}", feature.id);
    Ok(())
}

/// Retrieve a GIS feature from the database by ID
pub fn get_gis_feature_by_id(conn: &Arc<Mutex<Connection>>, id: &str) -> SqlResult<Option<GisFeature>> {
    let conn = conn.lock().unwrap();
    
    let mut stmt = conn.prepare(
        "SELECT id, feature_type, properties, geometry, 
                created_at, updated_at, created_by 
         FROM gis_features 
         WHERE id = ?"
    )?;
    
    let mut rows = stmt.query(params![id])?;
    
    if let Some(row) = rows.next()? {
        // Parse data from row
        let id: String = row.get(0)?;
        let feature_type: String = row.get(1)?;
        let properties_json: String = row.get(2)?;
        let geometry_json: String = row.get(3)?;
        let created_at_str: String = row.get(4)?;
        let updated_at_opt: Option<String> = row.get(5)?;
        let created_by: Option<String> = row.get(6)?;
        
        // Parse JSON strings
        let properties: GisFeatureProperties = serde_json::from_str(&properties_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            
        let geometry: GisFeatureGeometry = serde_json::from_str(&geometry_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            
        // Parse timestamps
        let created_at = chrono::DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?
            .with_timezone(&chrono::Utc);
            
        let updated_at = if let Some(dt_str) = updated_at_opt {
            Some(
                chrono::DateTime::parse_from_rfc3339(&dt_str)
                    .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?
                    .with_timezone(&chrono::Utc)
            )
        } else {
            None
        };
        
        // Construct the feature
        let feature = GisFeature {
            id,
            feature_type,
            properties,
            geometry,
            created_at,
            updated_at,
            created_by,
        };
        
        Ok(Some(feature))
    } else {
        Ok(None)
    }
}

/// Get all GIS features
pub fn get_all_gis_features(conn: &Arc<Mutex<Connection>>) -> SqlResult<Vec<GisFeature>> {
    let conn = conn.lock().unwrap();
    
    let mut stmt = conn.prepare(
        "SELECT id, feature_type, properties, geometry, 
                created_at, updated_at, created_by 
         FROM gis_features"
    )?;
    
    let rows = stmt.query_map([], |row| {
        // Parse data from row
        let id: String = row.get(0)?;
        let feature_type: String = row.get(1)?;
        let properties_json: String = row.get(2)?;
        let geometry_json: String = row.get(3)?;
        let created_at_str: String = row.get(4)?;
        let updated_at_opt: Option<String> = row.get(5)?;
        let created_by: Option<String> = row.get(6)?;
        
        // Parse JSON strings
        let properties_result: Result<GisFeatureProperties, _> = serde_json::from_str(&properties_json);
        let properties = match properties_result {
            Ok(props) => props,
            Err(e) => {
                error!("Failed to parse properties JSON: {}", e);
                return Err(rusqlite::Error::InvalidParameterName(e.to_string()));
            }
        };
            
        let geometry_result: Result<GisFeatureGeometry, _> = serde_json::from_str(&geometry_json);
        let geometry = match geometry_result {
            Ok(geom) => geom,
            Err(e) => {
                error!("Failed to parse geometry JSON: {}", e);
                return Err(rusqlite::Error::InvalidParameterName(e.to_string()));
            }
        };
            
        // Parse timestamps
        let created_at_result = chrono::DateTime::parse_from_rfc3339(&created_at_str);
        let created_at = match created_at_result {
            Ok(dt) => dt.with_timezone(&chrono::Utc),
            Err(e) => {
                error!("Failed to parse created_at timestamp: {}", e);
                return Err(rusqlite::Error::InvalidParameterName(e.to_string()));
            }
        };
            
        let updated_at = if let Some(dt_str) = updated_at_opt {
            let updated_at_result = chrono::DateTime::parse_from_rfc3339(&dt_str);
            match updated_at_result {
                Ok(dt) => Some(dt.with_timezone(&chrono::Utc)),
                Err(e) => {
                    error!("Failed to parse updated_at timestamp: {}", e);
                    return Err(rusqlite::Error::InvalidParameterName(e.to_string()));
                }
            }
        } else {
            None
        };
        
        // Construct the feature
        Ok(GisFeature {
            id,
            feature_type,
            properties,
            geometry,
            created_at,
            updated_at,
            created_by,
        })
    })?;
    
    let mut features = Vec::new();
    for row_result in rows {
        match row_result {
            Ok(feature) => features.push(feature),
            Err(e) => error!("Error retrieving feature: {}", e),
        }
    }
    
    Ok(features)
}

/// Save a document to the database
pub fn save_document(conn: &Arc<Mutex<Connection>>, document: &Document) -> SqlResult<()> {
    let conn = conn.lock().unwrap();
    
    // Start a transaction for atomicity
    let tx = conn.transaction()?;
    
    // Serialize metadata as JSON
    let metadata_json = serde_json::to_string(&document.metadata)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
    
    // Extract classification fields if available
    let (class_type, class_confidence, class_verified, class_date) = if let Some(ref classification) = document.classification {
        (
            Some(classification.document_type.clone()),
            Some(classification.confidence),
            Some(classification.is_verified as i32),
            Some(classification.classified_at.to_rfc3339()),
        )
    } else {
        (None, None, None, None)
    };
    
    // Insert document
    tx.execute(
        "INSERT INTO documents (
            id, filename, content_type, file_size, file_path,
            classification_type, classification_confidence, classification_verified, classification_date,
            metadata, uploaded_at, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            document.id,
            document.filename,
            document.content_type,
            document.file_size as i64,
            document.file_path,
            class_type,
            class_confidence,
            class_verified,
            class_date,
            metadata_json,
            document.uploaded_at.to_rfc3339(),
            document.uploaded_by,
        ],
    )?;
    
    // Insert document-parcel relationships if any
    if let Some(parcel_ids) = &document.metadata.parcel_ids {
        for parcel_id in parcel_ids {
            tx.execute(
                "INSERT INTO document_parcels (document_id, parcel_id) VALUES (?, ?)",
                params![document.id, parcel_id],
            )?;
        }
    }
    
    // Commit the transaction
    tx.commit()?;
    
    info!("Saved document with ID: {}", document.id);
    Ok(())
}

/// Get a document by ID
pub fn get_document_by_id(conn: &Arc<Mutex<Connection>>, id: &str) -> SqlResult<Option<Document>> {
    let conn = conn.lock().unwrap();
    
    let mut stmt = conn.prepare(
        "SELECT id, filename, content_type, file_size, file_path,
                classification_type, classification_confidence, classification_verified, classification_date,
                metadata, uploaded_at, uploaded_by
         FROM documents 
         WHERE id = ?"
    )?;
    
    let mut rows = stmt.query(params![id])?;
    
    if let Some(row) = rows.next()? {
        // Parse basic document data
        let id: String = row.get(0)?;
        let filename: String = row.get(1)?;
        let content_type: String = row.get(2)?;
        let file_size: i64 = row.get(3)?;
        let file_path: String = row.get(4)?;
        
        // Parse classification data
        let class_type: Option<String> = row.get(5)?;
        let class_confidence: Option<f32> = row.get(6)?;
        let class_verified: Option<i32> = row.get(7)?;
        let class_date: Option<String> = row.get(8)?;
        
        // Parse metadata
        let metadata_json: String = row.get(9)?;
        let metadata: DocumentMetadata = serde_json::from_str(&metadata_json)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        
        // Parse timestamps
        let uploaded_at_str: String = row.get(10)?;
        let uploaded_at = chrono::DateTime::parse_from_rfc3339(&uploaded_at_str)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?
            .with_timezone(&chrono::Utc);
        
        let uploaded_by: Option<String> = row.get(11)?;
        
        // Construct classification if available
        let classification = if let (Some(doc_type), Some(confidence), Some(verified), Some(date_str)) = 
            (class_type, class_confidence, class_verified, class_date) {
            
            let classified_at = chrono::DateTime::parse_from_rfc3339(&date_str)
                .map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?
                .with_timezone(&chrono::Utc);
                
            Some(DocumentClassification {
                document_type: doc_type,
                confidence,
                is_verified: verified != 0,
                classified_at,
            })
        } else {
            None
        };
        
        // Construct the document
        let document = Document {
            id,
            filename,
            content_type,
            file_size: file_size as usize,
            file_path,
            classification,
            metadata,
            uploaded_at,
            uploaded_by,
        };
        
        Ok(Some(document))
    } else {
        Ok(None)
    }
}

/// Get all documents
pub fn get_all_documents(conn: &Arc<Mutex<Connection>>) -> SqlResult<Vec<Document>> {
    let conn = conn.lock().unwrap();
    
    let mut stmt = conn.prepare(
        "SELECT id, filename, content_type, file_size, file_path,
                classification_type, classification_confidence, classification_verified, classification_date,
                metadata, uploaded_at, uploaded_by
         FROM documents"
    )?;
    
    let rows = stmt.query_map([], |row| {
        // Parse basic document data
        let id: String = row.get(0)?;
        let filename: String = row.get(1)?;
        let content_type: String = row.get(2)?;
        let file_size: i64 = row.get(3)?;
        let file_path: String = row.get(4)?;
        
        // Parse classification data
        let class_type: Option<String> = row.get(5)?;
        let class_confidence: Option<f32> = row.get(6)?;
        let class_verified: Option<i32> = row.get(7)?;
        let class_date: Option<String> = row.get(8)?;
        
        // Parse metadata
        let metadata_json: String = row.get(9)?;
        let metadata_result: Result<DocumentMetadata, _> = serde_json::from_str(&metadata_json);
        let metadata = match metadata_result {
            Ok(md) => md,
            Err(e) => {
                error!("Failed to parse document metadata: {}", e);
                return Err(rusqlite::Error::InvalidParameterName(e.to_string()));
            }
        };
        
        // Parse timestamps
        let uploaded_at_str: String = row.get(10)?;
        let uploaded_at_result = chrono::DateTime::parse_from_rfc3339(&uploaded_at_str);
        let uploaded_at = match uploaded_at_result {
            Ok(dt) => dt.with_timezone(&chrono::Utc),
            Err(e) => {
                error!("Failed to parse uploaded_at timestamp: {}", e);
                return Err(rusqlite::Error::InvalidParameterName(e.to_string()));
            }
        };
        
        let uploaded_by: Option<String> = row.get(11)?;
        
        // Construct classification if available
        let classification = if let (Some(doc_type), Some(confidence), Some(verified), Some(date_str)) = 
            (class_type, class_confidence, class_verified, class_date) {
            
            let classified_at_result = chrono::DateTime::parse_from_rfc3339(&date_str);
            match classified_at_result {
                Ok(dt) => {
                    Some(DocumentClassification {
                        document_type: doc_type,
                        confidence,
                        is_verified: verified != 0,
                        classified_at: dt.with_timezone(&chrono::Utc),
                    })
                },
                Err(e) => {
                    error!("Failed to parse classified_at timestamp: {}", e);
                    None
                }
            }
        } else {
            None
        };
        
        // Construct the document
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
    for row_result in rows {
        match row_result {
            Ok(doc) => documents.push(doc),
            Err(e) => error!("Error retrieving document: {}", e),
        }
    }
    
    Ok(documents)
}