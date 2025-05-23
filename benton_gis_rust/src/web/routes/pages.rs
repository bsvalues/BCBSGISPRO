use aci_dev::{web, HttpResponse, Responder};
use askama::Template;

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

pub async fn index() -> impl Responder {
    let template = IndexTemplate {
        title: "TerraFusion Platform - Benton County GIS".to_string(),
    };
    
    template.render().map(|body| {
        HttpResponse::Ok().content_type("text/html").body(body)
    }).unwrap_or_else(|err| {
        HttpResponse::InternalServerError().body(format!("Template error: {}", err))
    })
}

pub async fn map() -> impl Responder {
    let template = MapTemplate {
        title: "Map - TerraFusion Platform".to_string(),
    };
    
    template.render().map(|body| {
        HttpResponse::Ok().content_type("text/html").body(body)
    }).unwrap_or_else(|err| {
        HttpResponse::InternalServerError().body(format!("Template error: {}", err))
    })
}

pub async fn parcel_detail(path: web::Path<String>) -> impl Responder {
    let parcel_id = path.into_inner();
    
    let template = ParcelDetailTemplate {
        title: format!("Parcel {} - TerraFusion Platform", parcel_id),
        parcel_id,
    };
    
    template.render().map(|body| {
        HttpResponse::Ok().content_type("text/html").body(body)
    }).unwrap_or_else(|err| {
        HttpResponse::InternalServerError().body(format!("Template error: {}", err))
    })
}

pub async fn documents() -> impl Responder {
    let template = DocumentsTemplate {
        title: "Documents - TerraFusion Platform".to_string(),
    };
    
    template.render().map(|body| {
        HttpResponse::Ok().content_type("text/html").body(body)
    }).unwrap_or_else(|err| {
        HttpResponse::InternalServerError().body(format!("Template error: {}", err))
    })
}

pub async fn workflows() -> impl Responder {
    let template = WorkflowsTemplate {
        title: "Workflows - TerraFusion Platform".to_string(),
    };
    
    template.render().map(|body| {
        HttpResponse::Ok().content_type("text/html").body(body)
    }).unwrap_or_else(|err| {
        HttpResponse::InternalServerError().body(format!("Template error: {}", err))
    })
}

pub async fn dashboard() -> impl Responder {
    let template = DashboardTemplate {
        title: "Dashboard - TerraFusion Platform".to_string(),
    };
    
    template.render().map(|body| {
        HttpResponse::Ok().content_type("text/html").body(body)
    }).unwrap_or_else(|err| {
        HttpResponse::InternalServerError().body(format!("Template error: {}", err))
    })
}