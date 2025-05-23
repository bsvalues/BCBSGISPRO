use actix_web::{web, HttpResponse, Responder, Error};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use log::{info, error};

use crate::models::gis_feature::GisFeatureCollection;
use crate::models::document::{Document, DocumentMetadata};
use crate::integrations::workflow::{WorkflowItem, WorkflowStatus};
use crate::AppState;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/gis")
            .route("/parcels", web::get().to(get_parcels))
            .route("/parcels/{id}", web::get().to(get_parcel_by_id))
            .route("/zoning", web::get().to(get_zoning))
    );
    
    cfg.service(
        web::scope("/documents")
            .route("", web::get().to(get_documents))
            .route("", web::post().to(upload_document))
            .route("/{id}", web::get().to(get_document))
            .route("/{id}/content", web::get().to(get_document_content))
            .route("/{id}/classify", web::post().to(classify_document))
            .route("/parcel/{parcel_id}", web::get().to(get_documents_by_parcel))
    );
    
    cfg.service(
        web::scope("/workflows")
            .route("", web::get().to(get_workflows))
            .route("", web::post().to(create_workflow))
            .route("/{id}", web::get().to(get_workflow))
            .route("/{id}", web::put().to(update_workflow))
            .route("/{id}/events", web::get().to(get_workflow_events))
            .route("/{id}/events", web::post().to(add_workflow_event))
            .route("/type/{type}", web::get().to(get_workflows_by_type))
            .route("/parcel/{parcel_id}", web::get().to(get_workflows_by_parcel))
    );
}

// GIS routes
async fn get_parcels(
    state: web::Data<AppState>,
    query: web::Query<BoundsQuery>,
) -> Result<impl Responder, Error> {
    info!("API: Getting parcels");
    
    let bounds = if query.bounds.is_empty() {
        None
    } else {
        // Parse bounds format: "minLng,minLat,maxLng,maxLat"
        let parts: Vec<f64> = query.bounds
            .split(',')
            .filter_map(|s| s.parse::<f64>().ok())
            .collect();
        
        if parts.len() == 4 {
            Some([parts[0], parts[1], parts[2], parts[3]])
        } else {
            None
        }
    };
    
    match state.arcgis_client.get_parcels(bounds).await {
        Ok(parcels) => Ok(HttpResponse::Ok().json(parcels)),
        Err(e) => {
            error!("Error getting parcels: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_parcel_by_id(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let parcel_id = path.into_inner();
    info!("API: Getting parcel by ID: {}", parcel_id);
    
    match state.arcgis_client.get_feature_by_parcel_id(&parcel_id).await {
        Ok(Some(parcel)) => Ok(HttpResponse::Ok().json(parcel)),
        Ok(None) => Ok(HttpResponse::NotFound().body(format!("Parcel not found: {}", parcel_id))),
        Err(e) => {
            error!("Error getting parcel {}: {}", parcel_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_zoning(
    state: web::Data<AppState>,
    query: web::Query<BoundsQuery>,
) -> Result<impl Responder, Error> {
    info!("API: Getting zoning");
    
    let bounds = if query.bounds.is_empty() {
        None
    } else {
        // Parse bounds format: "minLng,minLat,maxLng,maxLat"
        let parts: Vec<f64> = query.bounds
            .split(',')
            .filter_map(|s| s.parse::<f64>().ok())
            .collect();
        
        if parts.len() == 4 {
            Some([parts[0], parts[1], parts[2], parts[3]])
        } else {
            None
        }
    };
    
    match state.arcgis_client.get_zoning(bounds).await {
        Ok(zoning) => Ok(HttpResponse::Ok().json(zoning)),
        Err(e) => {
            error!("Error getting zoning: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

// Document routes
async fn get_documents(
    state: web::Data<AppState>,
) -> Result<impl Responder, Error> {
    info!("API: Getting all documents");
    
    match state.document_manager.get_documents().await {
        Ok(documents) => Ok(HttpResponse::Ok().json(documents)),
        Err(e) => {
            error!("Error getting documents: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_document(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let document_id = path.into_inner();
    info!("API: Getting document: {}", document_id);
    
    match state.document_manager.get_document(&document_id).await {
        Ok(Some(document)) => Ok(HttpResponse::Ok().json(document)),
        Ok(None) => Ok(HttpResponse::NotFound().body(format!("Document not found: {}", document_id))),
        Err(e) => {
            error!("Error getting document {}: {}", document_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_document_content(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let document_id = path.into_inner();
    info!("API: Getting document content: {}", document_id);
    
    match state.document_manager.get_document(&document_id).await {
        Ok(Some(document)) => {
            match state.document_manager.get_document_content(&document_id).await {
                Ok(Some(content)) => {
                    Ok(HttpResponse::Ok()
                        .content_type(document.content_type)
                        .body(content))
                },
                Ok(None) => Ok(HttpResponse::NotFound().body(format!("Document content not found: {}", document_id))),
                Err(e) => {
                    error!("Error getting document content {}: {}", document_id, e);
                    Ok(HttpResponse::InternalServerError().body(e))
                }
            }
        },
        Ok(None) => Ok(HttpResponse::NotFound().body(format!("Document not found: {}", document_id))),
        Err(e) => {
            error!("Error getting document {}: {}", document_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

#[derive(Deserialize)]
struct DocumentUploadRequest {
    filename: String,
    content_type: String,
    content: String, // Base64 encoded
    metadata: Option<DocumentMetadata>,
}

async fn upload_document(
    state: web::Data<AppState>,
    data: web::Json<DocumentUploadRequest>,
) -> Result<impl Responder, Error> {
    info!("API: Uploading document: {}", data.filename);
    
    // Decode base64 content
    let content = match base64::decode(&data.content) {
        Ok(content) => content,
        Err(e) => {
            error!("Error decoding document content: {}", e);
            return Ok(HttpResponse::BadRequest().body(format!("Invalid base64 content: {}", e)));
        }
    };
    
    // Create metadata if not provided
    let metadata = data.metadata.clone().unwrap_or_else(|| {
        DocumentMetadata {
            title: None,
            description: None,
            parcel_ids: None,
            recording_date: None,
            recording_number: None,
            additional_properties: std::collections::HashMap::new(),
        }
    });
    
    match state.document_manager.upload_document(&data.filename, &data.content_type, &content, metadata).await {
        Ok(document) => Ok(HttpResponse::Ok().json(document)),
        Err(e) => {
            error!("Error uploading document: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

#[derive(Deserialize)]
struct DocumentClassificationRequest {
    document_type: String,
    confidence: f64,
}

async fn classify_document(
    state: web::Data<AppState>,
    path: web::Path<String>,
    data: web::Json<DocumentClassificationRequest>,
) -> Result<impl Responder, Error> {
    let document_id = path.into_inner();
    info!("API: Classifying document {} as {}", document_id, data.document_type);
    
    match state.document_manager.classify_document(&document_id, &data.document_type, data.confidence).await {
        Ok(document) => Ok(HttpResponse::Ok().json(document)),
        Err(e) => {
            error!("Error classifying document {}: {}", document_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_documents_by_parcel(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let parcel_id = path.into_inner();
    info!("API: Getting documents for parcel: {}", parcel_id);
    
    match state.document_manager.get_documents_by_parcel(&parcel_id).await {
        Ok(documents) => Ok(HttpResponse::Ok().json(documents)),
        Err(e) => {
            error!("Error getting documents for parcel {}: {}", parcel_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

// Workflow routes
async fn get_workflows(
    state: web::Data<AppState>,
) -> Result<impl Responder, Error> {
    info!("API: Getting all workflows");
    
    // For simplicity, we'll just get workflows by a generic type
    match state.workflow_manager.get_workflows_by_type("").await {
        Ok(workflows) => Ok(HttpResponse::Ok().json(workflows)),
        Err(e) => {
            error!("Error getting workflows: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_workflow(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let workflow_id = path.into_inner();
    info!("API: Getting workflow: {}", workflow_id);
    
    match state.workflow_manager.get_workflow(&workflow_id).await {
        Ok(Some(workflow)) => Ok(HttpResponse::Ok().json(workflow)),
        Ok(None) => Ok(HttpResponse::NotFound().body(format!("Workflow not found: {}", workflow_id))),
        Err(e) => {
            error!("Error getting workflow {}: {}", workflow_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

#[derive(Deserialize)]
struct WorkflowCreateRequest {
    title: String,
    description: Option<String>,
    workflow_type: String,
    assigned_to: Option<String>,
    parcel_ids: Option<Vec<String>>,
    document_ids: Option<Vec<String>>,
    #[serde(default)]
    metadata: std::collections::HashMap<String, serde_json::Value>,
}

async fn create_workflow(
    state: web::Data<AppState>,
    data: web::Json<WorkflowCreateRequest>,
) -> Result<impl Responder, Error> {
    info!("API: Creating workflow: {}", data.title);
    
    // Create new workflow
    let mut workflow = WorkflowItem::new(&data.title, &data.workflow_type);
    workflow.description = data.description.clone();
    workflow.assigned_to = data.assigned_to.clone();
    workflow.parcel_ids = data.parcel_ids.clone();
    workflow.document_ids = data.document_ids.clone();
    workflow.metadata = data.metadata.clone();
    
    match state.workflow_manager.create_workflow(&workflow).await {
        Ok(workflow_id) => {
            match state.workflow_manager.get_workflow(&workflow_id).await {
                Ok(Some(created_workflow)) => Ok(HttpResponse::Ok().json(created_workflow)),
                _ => Ok(HttpResponse::Ok().json(workflow_id)),
            }
        },
        Err(e) => {
            error!("Error creating workflow: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

#[derive(Deserialize)]
struct WorkflowUpdateRequest {
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    assigned_to: Option<String>,
    parcel_ids: Option<Vec<String>>,
    document_ids: Option<Vec<String>>,
    metadata: Option<std::collections::HashMap<String, serde_json::Value>>,
}

async fn update_workflow(
    state: web::Data<AppState>,
    path: web::Path<String>,
    data: web::Json<WorkflowUpdateRequest>,
) -> Result<impl Responder, Error> {
    let workflow_id = path.into_inner();
    info!("API: Updating workflow: {}", workflow_id);
    
    // Get current workflow
    let result = state.workflow_manager.get_workflow(&workflow_id).await;
    
    match result {
        Ok(Some(mut workflow)) => {
            // Update workflow fields
            if let Some(title) = &data.title {
                workflow.title = title.clone();
            }
            
            if let Some(description) = &data.description {
                workflow.description = Some(description.clone());
            }
            
            if let Some(status_str) = &data.status {
                workflow.status = match status_str.as_str() {
                    "pending" => WorkflowStatus::Pending,
                    "in_progress" => WorkflowStatus::InProgress,
                    "on_hold" => WorkflowStatus::OnHold,
                    "completed" => WorkflowStatus::Completed,
                    "cancelled" => WorkflowStatus::Cancelled,
                    _ => workflow.status,
                };
            }
            
            if data.assigned_to.is_some() {
                workflow.assigned_to = data.assigned_to.clone();
            }
            
            if data.parcel_ids.is_some() {
                workflow.parcel_ids = data.parcel_ids.clone();
            }
            
            if data.document_ids.is_some() {
                workflow.document_ids = data.document_ids.clone();
            }
            
            if let Some(metadata) = &data.metadata {
                workflow.metadata = metadata.clone();
            }
            
            // Update workflow in database
            match state.workflow_manager.update_workflow(&workflow).await {
                Ok(_) => Ok(HttpResponse::Ok().json(workflow)),
                Err(e) => {
                    error!("Error updating workflow {}: {}", workflow_id, e);
                    Ok(HttpResponse::InternalServerError().body(e))
                }
            }
        },
        Ok(None) => Ok(HttpResponse::NotFound().body(format!("Workflow not found: {}", workflow_id))),
        Err(e) => {
            error!("Error getting workflow {}: {}", workflow_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_workflow_events(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let workflow_id = path.into_inner();
    info!("API: Getting events for workflow: {}", workflow_id);
    
    match state.workflow_manager.get_workflow_events(&workflow_id).await {
        Ok(events) => Ok(HttpResponse::Ok().json(events)),
        Err(e) => {
            error!("Error getting workflow events {}: {}", workflow_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

#[derive(Deserialize)]
struct WorkflowEventRequest {
    event_type: String,
    description: String,
    user_id: Option<String>,
    #[serde(default)]
    metadata: std::collections::HashMap<String, serde_json::Value>,
}

async fn add_workflow_event(
    state: web::Data<AppState>,
    path: web::Path<String>,
    data: web::Json<WorkflowEventRequest>,
) -> Result<impl Responder, Error> {
    let workflow_id = path.into_inner();
    info!("API: Adding event to workflow {}: {}", workflow_id, data.event_type);
    
    // Create new event
    let mut event = crate::integrations::workflow::WorkflowEvent::new(
        &workflow_id,
        &data.event_type,
        &data.description,
    );
    
    event.user_id = data.user_id.clone();
    event.metadata = data.metadata.clone();
    
    match state.workflow_manager.add_workflow_event(&event).await {
        Ok(event_id) => Ok(HttpResponse::Ok().json(event_id)),
        Err(e) => {
            error!("Error adding workflow event: {}", e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_workflows_by_type(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let workflow_type = path.into_inner();
    info!("API: Getting workflows by type: {}", workflow_type);
    
    match state.workflow_manager.get_workflows_by_type(&workflow_type).await {
        Ok(workflows) => Ok(HttpResponse::Ok().json(workflows)),
        Err(e) => {
            error!("Error getting workflows by type {}: {}", workflow_type, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

async fn get_workflows_by_parcel(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let parcel_id = path.into_inner();
    info!("API: Getting workflows for parcel: {}", parcel_id);
    
    match state.workflow_manager.get_workflows_by_parcel(&parcel_id).await {
        Ok(workflows) => Ok(HttpResponse::Ok().json(workflows)),
        Err(e) => {
            error!("Error getting workflows for parcel {}: {}", parcel_id, e);
            Ok(HttpResponse::InternalServerError().body(e))
        }
    }
}

// Query parameters
#[derive(Deserialize)]
struct BoundsQuery {
    #[serde(default)]
    bounds: String,
}