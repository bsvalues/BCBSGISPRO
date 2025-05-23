use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use rusqlite::{Connection, Result, params, NO_PARAMS};
use log::{info, error};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowItem {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: WorkflowStatus,
    pub workflow_type: String,
    pub assigned_to: Option<String>,
    pub parcel_ids: Option<Vec<String>>,
    pub document_ids: Option<Vec<String>>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "on_hold")]
    OnHold,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEvent {
    pub id: String,
    pub workflow_id: String,
    pub event_type: String,
    pub description: String,
    pub previous_status: Option<WorkflowStatus>,
    pub new_status: Option<WorkflowStatus>,
    pub user_id: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

pub struct WorkflowManager {
    conn: Mutex<Connection>,
}

impl WorkflowItem {
    pub fn new(title: &str, workflow_type: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title: title.to_string(),
            description: None,
            status: WorkflowStatus::Pending,
            workflow_type: workflow_type.to_string(),
            assigned_to: None,
            parcel_ids: None,
            document_ids: None,
            metadata: HashMap::new(),
            created_at: Utc::now(),
            updated_at: None,
            completed_at: None,
        }
    }
}

impl WorkflowEvent {
    pub fn new(workflow_id: &str, event_type: &str, description: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            workflow_id: workflow_id.to_string(),
            event_type: event_type.to_string(),
            description: description.to_string(),
            previous_status: None,
            new_status: None,
            user_id: None,
            metadata: HashMap::new(),
            created_at: Utc::now(),
        }
    }
}

impl WorkflowManager {
    pub fn new(conn: Connection) -> Result<Self> {
        // Initialize database schema
        Self::initialize_schema(&conn)?;
        
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
    
    fn initialize_schema(conn: &Connection) -> Result<()> {
        info!("Initializing workflow schema");
        
        // Create workflows table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                workflow_type TEXT NOT NULL,
                assigned_to TEXT,
                parcel_ids TEXT,
                document_ids TEXT,
                metadata TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                completed_at TEXT
            )",
            NO_PARAMS,
        )?;
        
        // Create workflow events table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workflow_events (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                description TEXT NOT NULL,
                previous_status TEXT,
                new_status TEXT,
                user_id TEXT,
                metadata TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id)
            )",
            NO_PARAMS,
        )?;
        
        Ok(())
    }
    
    pub async fn create_workflow(&self, workflow: &WorkflowItem) -> Result<String, String> {
        info!("Creating workflow: {}", workflow.title);
        
        // Serialize metadata, parcel_ids, and document_ids to JSON
        let metadata_json = serde_json::to_string(&workflow.metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        
        let parcel_ids_json = if let Some(ref parcel_ids) = workflow.parcel_ids {
            Some(serde_json::to_string(parcel_ids)
                .map_err(|e| format!("Failed to serialize parcel_ids: {}", e))?)
        } else {
            None
        };
        
        let document_ids_json = if let Some(ref document_ids) = workflow.document_ids {
            Some(serde_json::to_string(document_ids)
                .map_err(|e| format!("Failed to serialize document_ids: {}", e))?)
        } else {
            None
        };
        
        // Convert status to string
        let status_str = match workflow.status {
            WorkflowStatus::Pending => "pending",
            WorkflowStatus::InProgress => "in_progress",
            WorkflowStatus::OnHold => "on_hold",
            WorkflowStatus::Completed => "completed",
            WorkflowStatus::Cancelled => "cancelled",
        };
        
        // Insert workflow into the database
        self.conn.lock().unwrap().execute(
            "INSERT INTO workflows (
                id, title, description, status, workflow_type, assigned_to, 
                parcel_ids, document_ids, metadata, created_at, updated_at, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                workflow.id,
                workflow.title,
                workflow.description,
                status_str,
                workflow.workflow_type,
                workflow.assigned_to,
                parcel_ids_json,
                document_ids_json,
                metadata_json,
                workflow.created_at.to_rfc3339(),
                workflow.updated_at.map(|dt| dt.to_rfc3339()),
                workflow.completed_at.map(|dt| dt.to_rfc3339()),
            ],
        ).map_err(|e| format!("Failed to insert workflow: {}", e))?;
        
        // Create initial workflow event
        let event = WorkflowEvent::new(
            &workflow.id,
            "create",
            &format!("Workflow \"{}\" created", workflow.title),
        );
        
        self.add_workflow_event(&event)
            .await
            .map_err(|e| format!("Failed to add workflow creation event: {}", e))?;
        
        Ok(workflow.id.clone())
    }
    
    pub async fn update_workflow(&self, workflow: &WorkflowItem) -> Result<(), String> {
        info!("Updating workflow: {}", workflow.id);
        
        // Get the current workflow to track changes
        let current_workflow = self.get_workflow(&workflow.id)
            .await
            .map_err(|e| format!("Failed to get current workflow: {}", e))?;
        
        if let Some(current) = current_workflow {
            // Serialize metadata, parcel_ids, and document_ids to JSON
            let metadata_json = serde_json::to_string(&workflow.metadata)
                .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
            
            let parcel_ids_json = if let Some(ref parcel_ids) = workflow.parcel_ids {
                Some(serde_json::to_string(parcel_ids)
                    .map_err(|e| format!("Failed to serialize parcel_ids: {}", e))?)
            } else {
                None
            };
            
            let document_ids_json = if let Some(ref document_ids) = workflow.document_ids {
                Some(serde_json::to_string(document_ids)
                    .map_err(|e| format!("Failed to serialize document_ids: {}", e))?)
            } else {
                None
            };
            
            // Convert status to string
            let status_str = match workflow.status {
                WorkflowStatus::Pending => "pending",
                WorkflowStatus::InProgress => "in_progress",
                WorkflowStatus::OnHold => "on_hold",
                WorkflowStatus::Completed => "completed",
                WorkflowStatus::Cancelled => "cancelled",
            };
            
            // Update the workflow in the database
            self.conn.lock().unwrap().execute(
                "UPDATE workflows SET 
                    title = ?, description = ?, status = ?, workflow_type = ?, assigned_to = ?, 
                    parcel_ids = ?, document_ids = ?, metadata = ?, updated_at = ?, completed_at = ?
                WHERE id = ?",
                params![
                    workflow.title,
                    workflow.description,
                    status_str,
                    workflow.workflow_type,
                    workflow.assigned_to,
                    parcel_ids_json,
                    document_ids_json,
                    metadata_json,
                    Utc::now().to_rfc3339(),
                    workflow.completed_at.map(|dt| dt.to_rfc3339()),
                    workflow.id,
                ],
            ).map_err(|e| format!("Failed to update workflow: {}", e))?;
            
            // Check if status has changed
            if current.status != workflow.status {
                // Create status change event
                let mut event = WorkflowEvent::new(
                    &workflow.id,
                    "status_change",
                    &format!("Status changed from {:?} to {:?}", current.status, workflow.status),
                );
                
                event.previous_status = Some(current.status);
                event.new_status = Some(workflow.status.clone());
                
                self.add_workflow_event(&event)
                    .await
                    .map_err(|e| format!("Failed to add status change event: {}", e))?;
            }
            
            // Check if assignment has changed
            if current.assigned_to != workflow.assigned_to {
                let description = match (&current.assigned_to, &workflow.assigned_to) {
                    (None, Some(new_assignee)) => format!("Assigned to {}", new_assignee),
                    (Some(old_assignee), Some(new_assignee)) => format!("Reassigned from {} to {}", old_assignee, new_assignee),
                    (Some(old_assignee), None) => format!("Unassigned from {}", old_assignee),
                    (None, None) => "Assignment updated".to_string(),
                };
                
                let event = WorkflowEvent::new(
                    &workflow.id,
                    "assignment_change",
                    &description,
                );
                
                self.add_workflow_event(&event)
                    .await
                    .map_err(|e| format!("Failed to add assignment change event: {}", e))?;
            }
            
            Ok(())
        } else {
            Err(format!("Workflow not found: {}", workflow.id))
        }
    }
    
    pub async fn get_workflow(&self, id: &str) -> Result<Option<WorkflowItem>, String> {
        info!("Getting workflow: {}", id);
        
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, workflow_type, assigned_to, 
                   parcel_ids, document_ids, metadata, created_at, updated_at, completed_at 
            FROM workflows 
            WHERE id = ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let workflow_result = stmt.query_row(params![id], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let description: Option<String> = row.get(2)?;
            let status_str: String = row.get(3)?;
            let workflow_type: String = row.get(4)?;
            let assigned_to: Option<String> = row.get(5)?;
            let parcel_ids_json: Option<String> = row.get(6)?;
            let document_ids_json: Option<String> = row.get(7)?;
            let metadata_json: String = row.get(8)?;
            let created_at: String = row.get(9)?;
            let updated_at: Option<String> = row.get(10)?;
            let completed_at: Option<String> = row.get(11)?;
            
            // Parse status
            let status = match status_str.as_str() {
                "pending" => WorkflowStatus::Pending,
                "in_progress" => WorkflowStatus::InProgress,
                "on_hold" => WorkflowStatus::OnHold,
                "completed" => WorkflowStatus::Completed,
                "cancelled" => WorkflowStatus::Cancelled,
                _ => WorkflowStatus::Pending,
            };
            
            // Deserialize JSON fields
            let metadata: HashMap<String, serde_json::Value> = serde_json::from_str(&metadata_json)
                .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize metadata: {}", e)))?;
            
            let parcel_ids: Option<Vec<String>> = if let Some(json) = parcel_ids_json {
                Some(serde_json::from_str(&json)
                    .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize parcel_ids: {}", e)))?)
            } else {
                None
            };
            
            let document_ids: Option<Vec<String>> = if let Some(json) = document_ids_json {
                Some(serde_json::from_str(&json)
                    .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to deserialize document_ids: {}", e)))?)
            } else {
                None
            };
            
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
            
            let completed_at = if let Some(dt) = completed_at {
                Some(chrono::DateTime::parse_from_rfc3339(&dt)
                    .map_err(|e| rusqlite::Error::InvalidParameterName(format!("Failed to parse completed_at: {}", e)))?
                    .with_timezone(&chrono::Utc))
            } else {
                None
            };
            
            Ok(WorkflowItem {
                id,
                title,
                description,
                status,
                workflow_type,
                assigned_to,
                parcel_ids,
                document_ids,
                metadata,
                created_at,
                updated_at,
                completed_at,
            })
        });
        
        match workflow_result {
            Ok(workflow) => Ok(Some(workflow)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Failed to get workflow: {}", e)),
        }
    }
    
    pub async fn get_workflows_by_type(&self, workflow_type: &str) -> Result<Vec<WorkflowItem>, String> {
        info!("Getting workflows by type: {}", workflow_type);
        
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, workflow_type, assigned_to, 
                   parcel_ids, document_ids, metadata, created_at, updated_at, completed_at 
            FROM workflows 
            WHERE workflow_type = ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let mut workflows = Vec::new();
        let mut rows = stmt.query(params![workflow_type])
            .map_err(|e| format!("Failed to execute query: {}", e))?;
        
        while let Some(row) = rows.next().map_err(|e| format!("Failed to iterate rows: {}", e))? {
            let id: String = row.get(0).map_err(|e| format!("Failed to get id: {}", e))?;
            let title: String = row.get(1).map_err(|e| format!("Failed to get title: {}", e))?;
            let description: Option<String> = row.get(2).map_err(|e| format!("Failed to get description: {}", e))?;
            let status_str: String = row.get(3).map_err(|e| format!("Failed to get status: {}", e))?;
            let workflow_type: String = row.get(4).map_err(|e| format!("Failed to get workflow_type: {}", e))?;
            let assigned_to: Option<String> = row.get(5).map_err(|e| format!("Failed to get assigned_to: {}", e))?;
            let parcel_ids_json: Option<String> = row.get(6).map_err(|e| format!("Failed to get parcel_ids: {}", e))?;
            let document_ids_json: Option<String> = row.get(7).map_err(|e| format!("Failed to get document_ids: {}", e))?;
            let metadata_json: String = row.get(8).map_err(|e| format!("Failed to get metadata: {}", e))?;
            let created_at: String = row.get(9).map_err(|e| format!("Failed to get created_at: {}", e))?;
            let updated_at: Option<String> = row.get(10).map_err(|e| format!("Failed to get updated_at: {}", e))?;
            let completed_at: Option<String> = row.get(11).map_err(|e| format!("Failed to get completed_at: {}", e))?;
            
            // Parse status
            let status = match status_str.as_str() {
                "pending" => WorkflowStatus::Pending,
                "in_progress" => WorkflowStatus::InProgress,
                "on_hold" => WorkflowStatus::OnHold,
                "completed" => WorkflowStatus::Completed,
                "cancelled" => WorkflowStatus::Cancelled,
                _ => WorkflowStatus::Pending,
            };
            
            // Deserialize JSON fields
            let metadata: HashMap<String, serde_json::Value> = serde_json::from_str(&metadata_json)
                .map_err(|e| format!("Failed to deserialize metadata: {}", e))?;
            
            let parcel_ids: Option<Vec<String>> = if let Some(json) = parcel_ids_json {
                Some(serde_json::from_str(&json)
                    .map_err(|e| format!("Failed to deserialize parcel_ids: {}", e))?)
            } else {
                None
            };
            
            let document_ids: Option<Vec<String>> = if let Some(json) = document_ids_json {
                Some(serde_json::from_str(&json)
                    .map_err(|e| format!("Failed to deserialize document_ids: {}", e))?)
            } else {
                None
            };
            
            // Parse timestamps
            let created_at = chrono::DateTime::parse_from_rfc3339(&created_at)
                .map_err(|e| format!("Failed to parse created_at: {}", e))?
                .with_timezone(&chrono::Utc);
            
            let updated_at = if let Some(dt) = updated_at {
                Some(chrono::DateTime::parse_from_rfc3339(&dt)
                    .map_err(|e| format!("Failed to parse updated_at: {}", e))?
                    .with_timezone(&chrono::Utc))
            } else {
                None
            };
            
            let completed_at = if let Some(dt) = completed_at {
                Some(chrono::DateTime::parse_from_rfc3339(&dt)
                    .map_err(|e| format!("Failed to parse completed_at: {}", e))?
                    .with_timezone(&chrono::Utc))
            } else {
                None
            };
            
            workflows.push(WorkflowItem {
                id,
                title,
                description,
                status,
                workflow_type,
                assigned_to,
                parcel_ids,
                document_ids,
                metadata,
                created_at,
                updated_at,
                completed_at,
            });
        }
        
        Ok(workflows)
    }
    
    pub async fn get_workflows_by_parcel(&self, parcel_id: &str) -> Result<Vec<WorkflowItem>, String> {
        info!("Getting workflows for parcel: {}", parcel_id);
        
        let parcel_id_pattern = format!("%\"{}\",%", parcel_id);
        
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, workflow_type, assigned_to, 
                   parcel_ids, document_ids, metadata, created_at, updated_at, completed_at 
            FROM workflows 
            WHERE parcel_ids LIKE ? OR parcel_ids LIKE ? OR parcel_ids LIKE ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let mut workflows = Vec::new();
        let mut rows = stmt.query(params![
            format!("[\"{}\",%", parcel_id),
            parcel_id_pattern,
            format!("%,\"{}\"]", parcel_id)
        ]).map_err(|e| format!("Failed to execute query: {}", e))?;
        
        while let Some(row) = rows.next().map_err(|e| format!("Failed to iterate rows: {}", e))? {
            // Extract and parse row data (same as in get_workflows_by_type)
            let id: String = row.get(0).map_err(|e| format!("Failed to get id: {}", e))?;
            let title: String = row.get(1).map_err(|e| format!("Failed to get title: {}", e))?;
            let description: Option<String> = row.get(2).map_err(|e| format!("Failed to get description: {}", e))?;
            let status_str: String = row.get(3).map_err(|e| format!("Failed to get status: {}", e))?;
            let workflow_type: String = row.get(4).map_err(|e| format!("Failed to get workflow_type: {}", e))?;
            let assigned_to: Option<String> = row.get(5).map_err(|e| format!("Failed to get assigned_to: {}", e))?;
            let parcel_ids_json: Option<String> = row.get(6).map_err(|e| format!("Failed to get parcel_ids: {}", e))?;
            let document_ids_json: Option<String> = row.get(7).map_err(|e| format!("Failed to get document_ids: {}", e))?;
            let metadata_json: String = row.get(8).map_err(|e| format!("Failed to get metadata: {}", e))?;
            let created_at: String = row.get(9).map_err(|e| format!("Failed to get created_at: {}", e))?;
            let updated_at: Option<String> = row.get(10).map_err(|e| format!("Failed to get updated_at: {}", e))?;
            let completed_at: Option<String> = row.get(11).map_err(|e| format!("Failed to get completed_at: {}", e))?;
            
            // Parse status
            let status = match status_str.as_str() {
                "pending" => WorkflowStatus::Pending,
                "in_progress" => WorkflowStatus::InProgress,
                "on_hold" => WorkflowStatus::OnHold,
                "completed" => WorkflowStatus::Completed,
                "cancelled" => WorkflowStatus::Cancelled,
                _ => WorkflowStatus::Pending,
            };
            
            // Deserialize JSON fields
            let metadata: HashMap<String, serde_json::Value> = serde_json::from_str(&metadata_json)
                .map_err(|e| format!("Failed to deserialize metadata: {}", e))?;
            
            let parcel_ids: Option<Vec<String>> = if let Some(json) = parcel_ids_json {
                Some(serde_json::from_str(&json)
                    .map_err(|e| format!("Failed to deserialize parcel_ids: {}", e))?)
            } else {
                None
            };
            
            let document_ids: Option<Vec<String>> = if let Some(json) = document_ids_json {
                Some(serde_json::from_str(&json)
                    .map_err(|e| format!("Failed to deserialize document_ids: {}", e))?)
            } else {
                None
            };
            
            // Parse timestamps
            let created_at = chrono::DateTime::parse_from_rfc3339(&created_at)
                .map_err(|e| format!("Failed to parse created_at: {}", e))?
                .with_timezone(&chrono::Utc);
            
            let updated_at = if let Some(dt) = updated_at {
                Some(chrono::DateTime::parse_from_rfc3339(&dt)
                    .map_err(|e| format!("Failed to parse updated_at: {}", e))?
                    .with_timezone(&chrono::Utc))
            } else {
                None
            };
            
            let completed_at = if let Some(dt) = completed_at {
                Some(chrono::DateTime::parse_from_rfc3339(&dt)
                    .map_err(|e| format!("Failed to parse completed_at: {}", e))?
                    .with_timezone(&chrono::Utc))
            } else {
                None
            };
            
            // Check if parcel_id is actually in the parcel_ids list
            if let Some(ref ids) = parcel_ids {
                if ids.contains(&parcel_id.to_string()) {
                    workflows.push(WorkflowItem {
                        id,
                        title,
                        description,
                        status,
                        workflow_type,
                        assigned_to,
                        parcel_ids,
                        document_ids,
                        metadata,
                        created_at,
                        updated_at,
                        completed_at,
                    });
                }
            }
        }
        
        Ok(workflows)
    }
    
    pub async fn add_workflow_event(&self, event: &WorkflowEvent) -> Result<String, String> {
        info!("Adding workflow event: {} for workflow {}", event.event_type, event.workflow_id);
        
        // Serialize metadata to JSON
        let metadata_json = serde_json::to_string(&event.metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        
        // Convert status to string if present
        let previous_status_str = if let Some(ref status) = event.previous_status {
            match status {
                WorkflowStatus::Pending => Some("pending".to_string()),
                WorkflowStatus::InProgress => Some("in_progress".to_string()),
                WorkflowStatus::OnHold => Some("on_hold".to_string()),
                WorkflowStatus::Completed => Some("completed".to_string()),
                WorkflowStatus::Cancelled => Some("cancelled".to_string()),
            }
        } else {
            None
        };
        
        let new_status_str = if let Some(ref status) = event.new_status {
            match status {
                WorkflowStatus::Pending => Some("pending".to_string()),
                WorkflowStatus::InProgress => Some("in_progress".to_string()),
                WorkflowStatus::OnHold => Some("on_hold".to_string()),
                WorkflowStatus::Completed => Some("completed".to_string()),
                WorkflowStatus::Cancelled => Some("cancelled".to_string()),
            }
        } else {
            None
        };
        
        // Insert event into the database
        self.conn.lock().unwrap().execute(
            "INSERT INTO workflow_events (
                id, workflow_id, event_type, description, previous_status, 
                new_status, user_id, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                event.id,
                event.workflow_id,
                event.event_type,
                event.description,
                previous_status_str,
                new_status_str,
                event.user_id,
                metadata_json,
                event.created_at.to_rfc3339(),
            ],
        ).map_err(|e| format!("Failed to insert workflow event: {}", e))?;
        
        Ok(event.id.clone())
    }
    
    pub async fn get_workflow_events(&self, workflow_id: &str) -> Result<Vec<WorkflowEvent>, String> {
        info!("Getting events for workflow: {}", workflow_id);
        
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workflow_id, event_type, description, previous_status, 
                   new_status, user_id, metadata, created_at 
            FROM workflow_events 
            WHERE workflow_id = ?
            ORDER BY created_at ASC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let mut events = Vec::new();
        let mut rows = stmt.query(params![workflow_id])
            .map_err(|e| format!("Failed to execute query: {}", e))?;
        
        while let Some(row) = rows.next().map_err(|e| format!("Failed to iterate rows: {}", e))? {
            let id: String = row.get(0).map_err(|e| format!("Failed to get id: {}", e))?;
            let workflow_id: String = row.get(1).map_err(|e| format!("Failed to get workflow_id: {}", e))?;
            let event_type: String = row.get(2).map_err(|e| format!("Failed to get event_type: {}", e))?;
            let description: String = row.get(3).map_err(|e| format!("Failed to get description: {}", e))?;
            let previous_status_str: Option<String> = row.get(4).map_err(|e| format!("Failed to get previous_status: {}", e))?;
            let new_status_str: Option<String> = row.get(5).map_err(|e| format!("Failed to get new_status: {}", e))?;
            let user_id: Option<String> = row.get(6).map_err(|e| format!("Failed to get user_id: {}", e))?;
            let metadata_json: String = row.get(7).map_err(|e| format!("Failed to get metadata: {}", e))?;
            let created_at: String = row.get(8).map_err(|e| format!("Failed to get created_at: {}", e))?;
            
            // Parse status
            let previous_status = if let Some(status_str) = previous_status_str {
                match status_str.as_str() {
                    "pending" => Some(WorkflowStatus::Pending),
                    "in_progress" => Some(WorkflowStatus::InProgress),
                    "on_hold" => Some(WorkflowStatus::OnHold),
                    "completed" => Some(WorkflowStatus::Completed),
                    "cancelled" => Some(WorkflowStatus::Cancelled),
                    _ => None,
                }
            } else {
                None
            };
            
            let new_status = if let Some(status_str) = new_status_str {
                match status_str.as_str() {
                    "pending" => Some(WorkflowStatus::Pending),
                    "in_progress" => Some(WorkflowStatus::InProgress),
                    "on_hold" => Some(WorkflowStatus::OnHold),
                    "completed" => Some(WorkflowStatus::Completed),
                    "cancelled" => Some(WorkflowStatus::Cancelled),
                    _ => None,
                }
            } else {
                None
            };
            
            // Deserialize metadata
            let metadata: HashMap<String, serde_json::Value> = serde_json::from_str(&metadata_json)
                .map_err(|e| format!("Failed to deserialize metadata: {}", e))?;
            
            // Parse timestamp
            let created_at = chrono::DateTime::parse_from_rfc3339(&created_at)
                .map_err(|e| format!("Failed to parse created_at: {}", e))?
                .with_timezone(&chrono::Utc);
            
            events.push(WorkflowEvent {
                id,
                workflow_id,
                event_type,
                description,
                previous_status,
                new_status,
                user_id,
                metadata,
                created_at,
            });
        }
        
        Ok(events)
    }
}