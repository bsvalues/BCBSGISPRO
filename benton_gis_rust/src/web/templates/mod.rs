use askama::Template;
use crate::models::document::Document;

// Template structs for pages
#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTemplate<'a> {
    pub active_page: &'a str,
    pub recent_updates: Vec<Update>,
}

#[derive(Template)]
#[template(path = "map.html")]
pub struct MapTemplate<'a> {
    pub active_page: &'a str,
    pub mapbox_token: &'a str,
}

#[derive(Template)]
#[template(path = "documents.html")]
pub struct DocumentsTemplate<'a> {
    pub active_page: &'a str,
    pub documents: Vec<Document>,
}

// Update data for home page
pub struct Update {
    pub title: String,
    pub description: String,
    pub date: String,
}