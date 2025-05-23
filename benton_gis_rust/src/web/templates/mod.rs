use askama::Template;
use crate::models::document::Document;
use crate::integrations::workflow::Workflow;

// Common update struct for displaying recent activity
#[derive(Debug, Clone)]
pub struct Update {
    pub title: String,
    pub description: String,
    pub date: String,
}

// Index/Home page template
#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate<'a> {
    pub active_page: &'a str,
    pub recent_updates: Vec<Update>,
}

// Map page template
#[derive(Template)]
#[template(path = "map.html")]
pub struct MapTemplate<'a> {
    pub active_page: &'a str,
    pub mapbox_token: &'a str,
}

// Documents page template
#[derive(Template)]
#[template(path = "documents.html")]
pub struct DocumentsTemplate<'a> {
    pub active_page: &'a str,
    pub documents: Vec<Document>,
}

// Workflows page template
#[derive(Template)]
#[template(path = "workflows.html")]
pub struct WorkflowsTemplate<'a> {
    pub active_page: &'a str,
    pub workflows: Vec<Workflow>,
}

// Document detail page template
#[derive(Template)]
#[template(path = "document_detail.html")]
pub struct DocumentDetailTemplate<'a> {
    pub active_page: &'a str,
    pub document: Document,
    pub related_workflows: Vec<Workflow>,
}

// Workflow detail page template
#[derive(Template)]
#[template(path = "workflow_detail.html")]
pub struct WorkflowDetailTemplate<'a> {
    pub active_page: &'a str,
    pub workflow: Workflow,
    pub related_documents: Vec<Document>,
}