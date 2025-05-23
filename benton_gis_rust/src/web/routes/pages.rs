use actix_web::{web, HttpResponse, Responder, Error};
use askama_actix::Template;
use log::info;

use crate::AppState;

// Template structs - these will be rendered with Askama
#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {
    title: String,
}

#[derive(Template)]
#[template(path = "map.html")]
struct MapTemplate {
    title: String,
}

#[derive(Template)]
#[template(path = "parcel_detail.html")]
struct ParcelDetailTemplate {
    title: String,
    parcel_id: String,
}

#[derive(Template)]
#[template(path = "documents.html")]
struct DocumentsTemplate {
    title: String,
}

#[derive(Template)]
#[template(path = "workflows.html")]
struct WorkflowsTemplate {
    title: String,
}

#[derive(Template)]
#[template(path = "dashboard.html")]
struct DashboardTemplate {
    title: String,
}

// Page route handlers
pub async fn index() -> Result<impl Responder, Error> {
    info!("Rendering index page");
    
    let template = IndexTemplate {
        title: "TerraFusion Platform - Benton County GIS".to_string(),
    };
    
    Ok(template)
}

pub async fn map() -> Result<impl Responder, Error> {
    info!("Rendering map page");
    
    let template = MapTemplate {
        title: "Map - TerraFusion Platform".to_string(),
    };
    
    Ok(template)
}

pub async fn parcel_detail(
    path: web::Path<String>,
) -> Result<impl Responder, Error> {
    let parcel_id = path.into_inner();
    info!("Rendering parcel detail page for: {}", parcel_id);
    
    let template = ParcelDetailTemplate {
        title: format!("Parcel {} - TerraFusion Platform", parcel_id),
        parcel_id,
    };
    
    Ok(template)
}

pub async fn documents() -> Result<impl Responder, Error> {
    info!("Rendering documents page");
    
    let template = DocumentsTemplate {
        title: "Documents - TerraFusion Platform".to_string(),
    };
    
    Ok(template)
}

pub async fn workflows() -> Result<impl Responder, Error> {
    info!("Rendering workflows page");
    
    let template = WorkflowsTemplate {
        title: "Workflows - TerraFusion Platform".to_string(),
    };
    
    Ok(template)
}

pub async fn dashboard() -> Result<impl Responder, Error> {
    info!("Rendering dashboard page");
    
    let template = DashboardTemplate {
        title: "Dashboard - TerraFusion Platform".to_string(),
    };
    
    Ok(template)
}