use actix_web::{web, HttpResponse, Responder};

pub fn configure(cfg: &mut web::ServiceConfig) {
    // Configure GIS routes
    cfg.service(
        web::scope("/gis")
            .route("/parcels", web::get().to(get_parcels))
            .route("/parcels/{id}", web::get().to(get_parcel_by_id))
            .route("/zoning", web::get().to(get_zoning))
    );
    
    // Configure document routes
    cfg.service(
        web::scope("/documents")
            .route("", web::get().to(get_documents))
            .route("", web::post().to(upload_document))
            .route("/{id}", web::get().to(get_document))
            .route("/{id}/content", web::get().to(get_document_content))
            .route("/{id}/classify", web::post().to(classify_document))
            .route("/parcel/{parcel_id}", web::get().to(get_documents_by_parcel))
    );
    
    // Configure workflow routes
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

// Placeholder API handlers for demo purposes
// In a production system, these would connect to real data sources

// GIS handlers
async fn get_parcels(_query: web::Query<std::collections::HashMap<String, String>>) -> impl Responder {
    let sample_data = r#"{
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "parcel_number": "1-2345-001",
                    "address": "123 Main St, Kennewick, WA",
                    "zoning": "R1",
                    "additional_properties": {
                        "OWNER": "Smith, John",
                        "ACRES": 1.25,
                        "SITUS": "123 Main St, Kennewick, WA",
                        "TAX_CODE": "RES01"
                    }
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[-119.2, 46.2], [-119.19, 46.2], [-119.19, 46.21], [-119.2, 46.21], [-119.2, 46.2]]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "parcel_number": "1-2345-002",
                    "address": "125 Main St, Kennewick, WA",
                    "zoning": "R1",
                    "additional_properties": {
                        "OWNER": "Johnson, Sarah",
                        "ACRES": 0.75,
                        "SITUS": "125 Main St, Kennewick, WA",
                        "TAX_CODE": "RES01"
                    }
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[-119.19, 46.2], [-119.18, 46.2], [-119.18, 46.21], [-119.19, 46.21], [-119.19, 46.2]]]
                }
            }
        ]
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn get_parcel_by_id(path: web::Path<String>) -> impl Responder {
    let parcel_id = path.into_inner();
    
    let sample_data = format!(r#"{{
        "type": "Feature",
        "properties": {{
            "parcel_number": "{}",
            "address": "123 Main St, Kennewick, WA",
            "zoning": "R1",
            "additional_properties": {{
                "OWNER": "Smith, John",
                "ACRES": 1.25,
                "SITUS": "123 Main St, Kennewick, WA",
                "TAX_CODE": "RES01",
                "LAND_VALUE": 125000,
                "IMP_VALUE": 275000
            }}
        }},
        "geometry": {{
            "type": "Polygon",
            "coordinates": [[[-119.2, 46.2], [-119.19, 46.2], [-119.19, 46.21], [-119.2, 46.21], [-119.2, 46.2]]]
        }}
    }}"#, parcel_id);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn get_zoning(_query: web::Query<std::collections::HashMap<String, String>>) -> impl Responder {
    let sample_data = r#"{
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "R1",
                    "description": "Single-Family Residential",
                    "additional_properties": {
                        "ZONE_CODE": "R1",
                        "ZONE_TYPE": "RESIDENTIAL",
                        "DESCRIPTION": "Single-Family Residential"
                    }
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[-119.21, 46.19], [-119.18, 46.19], [-119.18, 46.22], [-119.21, 46.22], [-119.21, 46.19]]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "C1",
                    "description": "Commercial",
                    "additional_properties": {
                        "ZONE_CODE": "C1",
                        "ZONE_TYPE": "COMMERCIAL",
                        "DESCRIPTION": "Neighborhood Commercial"
                    }
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[-119.18, 46.19], [-119.16, 46.19], [-119.16, 46.21], [-119.18, 46.21], [-119.18, 46.19]]]
                }
            }
        ]
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

// Document handlers
async fn get_documents() -> impl Responder {
    let sample_data = r#"[
        {
            "id": "doc-001",
            "filename": "deed-123-main.pdf",
            "content_type": "application/pdf",
            "file_size": 125436,
            "file_path": "/data/documents/doc-001/deed-123-main.pdf",
            "classification": {
                "document_type": "deed",
                "confidence": 0.95,
                "is_verified": true,
                "classified_at": "2023-10-15T09:45:00Z"
            },
            "metadata": {
                "title": "Deed for 123 Main St",
                "description": "Property transfer deed",
                "parcel_ids": ["1-2345-001"],
                "recording_date": "2023-10-14T00:00:00Z",
                "recording_number": "2023-45678",
                "additional_properties": {}
            },
            "uploaded_at": "2023-10-15T09:30:00Z",
            "uploaded_by": "admin"
        },
        {
            "id": "doc-002",
            "filename": "survey-123-main.pdf",
            "content_type": "application/pdf",
            "file_size": 3245298,
            "file_path": "/data/documents/doc-002/survey-123-main.pdf",
            "classification": {
                "document_type": "survey",
                "confidence": 0.92,
                "is_verified": true,
                "classified_at": "2023-10-15T10:15:00Z"
            },
            "metadata": {
                "title": "Survey for 123 Main St",
                "description": "Property boundary survey",
                "parcel_ids": ["1-2345-001"],
                "recording_date": "2023-09-20T00:00:00Z",
                "recording_number": "2023-45123",
                "additional_properties": {}
            },
            "uploaded_at": "2023-10-15T10:00:00Z",
            "uploaded_by": "admin"
        }
    ]"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn get_document(path: web::Path<String>) -> impl Responder {
    let document_id = path.into_inner();
    
    let sample_data = format!(r#"{{
        "id": "{}",
        "filename": "deed-123-main.pdf",
        "content_type": "application/pdf",
        "file_size": 125436,
        "file_path": "/data/documents/{}/deed-123-main.pdf",
        "classification": {{
            "document_type": "deed",
            "confidence": 0.95,
            "is_verified": true,
            "classified_at": "2023-10-15T09:45:00Z"
        }},
        "metadata": {{
            "title": "Deed for 123 Main St",
            "description": "Property transfer deed",
            "parcel_ids": ["1-2345-001"],
            "recording_date": "2023-10-14T00:00:00Z",
            "recording_number": "2023-45678",
            "additional_properties": {{}}
        }},
        "uploaded_at": "2023-10-15T09:30:00Z",
        "uploaded_by": "admin"
    }}"#, document_id, document_id);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn get_document_content(_path: web::Path<String>) -> impl Responder {
    // For demo purposes, return a placeholder content
    HttpResponse::Ok().content_type("text/plain").body("This is a placeholder for document content.")
}

async fn upload_document(_payload: web::Json<serde_json::Value>) -> impl Responder {
    let sample_response = r#"{
        "success": true,
        "document_id": "doc-003",
        "error": null
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_response)
}

async fn classify_document(_path: web::Path<String>, _payload: web::Json<serde_json::Value>) -> impl Responder {
    let sample_response = r#"{
        "success": true,
        "classification": {
            "document_type": "deed",
            "confidence": 0.95,
            "is_verified": false,
            "classified_at": "2023-10-15T10:30:00Z"
        },
        "error": null
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_response)
}

async fn get_documents_by_parcel(path: web::Path<String>) -> impl Responder {
    let parcel_id = path.into_inner();
    
    let sample_data = format!(r#"[
        {{
            "id": "doc-001",
            "filename": "deed-123-main.pdf",
            "content_type": "application/pdf",
            "file_size": 125436,
            "file_path": "/data/documents/doc-001/deed-123-main.pdf",
            "classification": {{
                "document_type": "deed",
                "confidence": 0.95,
                "is_verified": true,
                "classified_at": "2023-10-15T09:45:00Z"
            }},
            "metadata": {{
                "title": "Deed for Parcel {}",
                "description": "Property transfer deed",
                "parcel_ids": ["{}"],
                "recording_date": "2023-10-14T00:00:00Z",
                "recording_number": "2023-45678",
                "additional_properties": {{}}
            }},
            "uploaded_at": "2023-10-15T09:30:00Z",
            "uploaded_by": "admin"
        }},
        {{
            "id": "doc-002",
            "filename": "survey-123-main.pdf",
            "content_type": "application/pdf",
            "file_size": 3245298,
            "file_path": "/data/documents/doc-002/survey-123-main.pdf",
            "classification": {{
                "document_type": "survey",
                "confidence": 0.92,
                "is_verified": true,
                "classified_at": "2023-10-15T10:15:00Z"
            }},
            "metadata": {{
                "title": "Survey for Parcel {}",
                "description": "Property boundary survey",
                "parcel_ids": ["{}"],
                "recording_date": "2023-09-20T00:00:00Z",
                "recording_number": "2023-45123",
                "additional_properties": {{}}
            }},
            "uploaded_at": "2023-10-15T10:00:00Z",
            "uploaded_by": "admin"
        }}
    ]"#, parcel_id, parcel_id, parcel_id, parcel_id);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

// Workflow handlers
async fn get_workflows() -> impl Responder {
    let sample_data = r#"[
        {
            "id": "wf-001",
            "title": "Boundary Line Adjustment - 123 Main St",
            "description": "Processing boundary line adjustment for parcels 1-2345-001 and 1-2345-002",
            "status": "in_progress",
            "workflow_type": "boundary_adjustment",
            "assigned_to": "jane.doe",
            "parcel_ids": ["1-2345-001", "1-2345-002"],
            "document_ids": ["doc-001", "doc-002"],
            "metadata": {},
            "created_at": "2023-10-10T08:30:00Z",
            "updated_at": "2023-10-15T14:20:00Z",
            "completed_at": null
        },
        {
            "id": "wf-002",
            "title": "Building Permit Review - 456 Oak St",
            "description": "Reviewing building permit application",
            "status": "pending",
            "workflow_type": "permit_review",
            "assigned_to": null,
            "parcel_ids": ["1-2346-005"],
            "document_ids": ["doc-003"],
            "metadata": {},
            "created_at": "2023-10-14T09:45:00Z",
            "updated_at": null,
            "completed_at": null
        }
    ]"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn get_workflow(path: web::Path<String>) -> impl Responder {
    let workflow_id = path.into_inner();
    
    let sample_data = format!(r#"{{
        "id": "{}",
        "title": "Boundary Line Adjustment - 123 Main St",
        "description": "Processing boundary line adjustment for parcels 1-2345-001 and 1-2345-002",
        "status": "in_progress",
        "workflow_type": "boundary_adjustment",
        "assigned_to": "jane.doe",
        "parcel_ids": ["1-2345-001", "1-2345-002"],
        "document_ids": ["doc-001", "doc-002"],
        "metadata": {{}},
        "created_at": "2023-10-10T08:30:00Z",
        "updated_at": "2023-10-15T14:20:00Z",
        "completed_at": null
    }}"#, workflow_id);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn create_workflow(_payload: web::Json<serde_json::Value>) -> impl Responder {
    let sample_response = r#"{
        "id": "wf-003",
        "title": "New Workflow",
        "description": "New workflow description",
        "status": "pending",
        "workflow_type": "custom",
        "assigned_to": null,
        "parcel_ids": [],
        "document_ids": [],
        "metadata": {},
        "created_at": "2023-10-15T15:30:00Z",
        "updated_at": null,
        "completed_at": null
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_response)
}

async fn update_workflow(_path: web::Path<String>, _payload: web::Json<serde_json::Value>) -> impl Responder {
    let sample_response = r#"{
        "id": "wf-001",
        "title": "Updated Workflow",
        "description": "Updated workflow description",
        "status": "in_progress",
        "workflow_type": "boundary_adjustment",
        "assigned_to": "jane.doe",
        "parcel_ids": ["1-2345-001", "1-2345-002"],
        "document_ids": ["doc-001", "doc-002"],
        "metadata": {},
        "created_at": "2023-10-10T08:30:00Z",
        "updated_at": "2023-10-15T15:45:00Z",
        "completed_at": null
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_response)
}

async fn get_workflow_events(path: web::Path<String>) -> impl Responder {
    let workflow_id = path.into_inner();
    
    let sample_data = format!(r#"[
        {{
            "id": "evt-001",
            "workflow_id": "{}",
            "event_type": "create",
            "description": "Workflow created",
            "previous_status": null,
            "new_status": "pending",
            "user_id": "john.doe",
            "metadata": {{}},
            "created_at": "2023-10-10T08:30:00Z"
        }},
        {{
            "id": "evt-002",
            "workflow_id": "{}",
            "event_type": "status_change",
            "description": "Status changed from pending to in_progress",
            "previous_status": "pending",
            "new_status": "in_progress",
            "user_id": "jane.doe",
            "metadata": {{}},
            "created_at": "2023-10-12T10:15:00Z"
        }},
        {{
            "id": "evt-003",
            "workflow_id": "{}",
            "event_type": "assignment_change",
            "description": "Assigned to jane.doe",
            "previous_status": null,
            "new_status": null,
            "user_id": "john.doe",
            "metadata": {{}},
            "created_at": "2023-10-12T10:20:00Z"
        }}
    ]"#, workflow_id, workflow_id, workflow_id);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn add_workflow_event(_path: web::Path<String>, _payload: web::Json<serde_json::Value>) -> impl Responder {
    let sample_response = r#"{
        "id": "evt-004",
        "workflow_id": "wf-001",
        "event_type": "comment",
        "description": "Added new comment",
        "previous_status": null,
        "new_status": null,
        "user_id": "john.doe",
        "metadata": {},
        "created_at": "2023-10-15T16:00:00Z"
    }"#;
    
    HttpResponse::Ok().content_type("application/json").body(sample_response)
}

async fn get_workflows_by_type(path: web::Path<String>) -> impl Responder {
    let workflow_type = path.into_inner();
    
    let sample_data = format!(r#"[
        {{
            "id": "wf-001",
            "title": "Boundary Line Adjustment - 123 Main St",
            "description": "Processing boundary line adjustment for parcels 1-2345-001 and 1-2345-002",
            "status": "in_progress",
            "workflow_type": "{}",
            "assigned_to": "jane.doe",
            "parcel_ids": ["1-2345-001", "1-2345-002"],
            "document_ids": ["doc-001", "doc-002"],
            "metadata": {{}},
            "created_at": "2023-10-10T08:30:00Z",
            "updated_at": "2023-10-15T14:20:00Z",
            "completed_at": null
        }}
    ]"#, workflow_type);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}

async fn get_workflows_by_parcel(path: web::Path<String>) -> impl Responder {
    let parcel_id = path.into_inner();
    
    let sample_data = format!(r#"[
        {{
            "id": "wf-001",
            "title": "Boundary Line Adjustment - Parcel {}",
            "description": "Processing boundary line adjustment",
            "status": "in_progress",
            "workflow_type": "boundary_adjustment",
            "assigned_to": "jane.doe",
            "parcel_ids": ["{}"],
            "document_ids": ["doc-001", "doc-002"],
            "metadata": {{}},
            "created_at": "2023-10-10T08:30:00Z",
            "updated_at": "2023-10-15T14:20:00Z",
            "completed_at": null
        }}
    ]"#, parcel_id, parcel_id);
    
    HttpResponse::Ok().content_type("application/json").body(sample_data)
}