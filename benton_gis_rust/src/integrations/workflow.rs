use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::path::Path;
use log::{info, error};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// Workflow storage path
const WORKFLOW_DATA_PATH: &str = "data/workflows";
const WORKFLOW_INDEX_PATH: &str = "data/workflow_index.json";

/// Workflow statuses
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "review")]
    Review,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "rejected")]
    Rejected,
    #[serde(rename = "on_hold")]
    OnHold,
}

impl Default for WorkflowStatus {
    fn default() -> Self {
        WorkflowStatus::Pending
    }
}

/// Workflow types for Benton County
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkflowType {
    #[serde(rename = "deed_processing")]
    DeedProcessing,
    #[serde(rename = "boundary_line_adjustment")]
    BoundaryLineAdjustment,
    #[serde(rename = "plat_review")]
    PlatReview,
    #[serde(rename = "property_split")]
    PropertySplit,
    #[serde(rename = "address_assignment")]
    AddressAssignment,
    #[serde(rename = "property_assessment")]
    PropertyAssessment,
    #[serde(rename = "record_update")]
    RecordUpdate,
    #[serde(rename = "exemption_request")]
    ExemptionRequest,
}

/// Workflow item representing a single task in the workflow process
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: WorkflowStatus,
    pub assigned_to: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub notes: Option<String>,
    pub documents: Vec<String>, // Document IDs
}

impl WorkflowStep {
    pub fn new(title: &str, description: Option<&str>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title: title.to_string(),
            description: description.map(String::from),
            status: WorkflowStatus::Pending,
            assigned_to: None,
            due_date: None,
            completed_date: None,
            notes: None,
            documents: Vec::new(),
        }
    }
}

/// Workflow containing multiple steps
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub title: String,
    pub workflow_type: WorkflowType,
    pub description: Option<String>,
    pub status: WorkflowStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub assigned_to: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_date: Option<DateTime<Utc>>,
    pub steps: Vec<WorkflowStep>,
    pub parcel_ids: Vec<String>,
    pub documents: Vec<String>, // Document IDs
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Workflow {
    pub fn new(title: &str, workflow_type: WorkflowType, description: Option<&str>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title: title.to_string(),
            workflow_type,
            description: description.map(String::from),
            status: WorkflowStatus::Pending,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            created_by: None,
            assigned_to: None,
            due_date: None,
            completed_date: None,
            steps: Vec::new(),
            parcel_ids: Vec::new(),
            documents: Vec::new(),
            metadata: HashMap::new(),
        }
    }
    
    pub fn add_step(&mut self, step: WorkflowStep) {
        self.steps.push(step);
        self.updated_at = Utc::now();
    }
    
    pub fn add_document(&mut self, document_id: &str) {
        if !self.documents.contains(&document_id.to_string()) {
            self.documents.push(document_id.to_string());
            self.updated_at = Utc::now();
        }
    }
    
    pub fn add_parcel(&mut self, parcel_id: &str) {
        if !self.parcel_ids.contains(&parcel_id.to_string()) {
            self.parcel_ids.push(parcel_id.to_string());
            self.updated_at = Utc::now();
        }
    }
    
    pub fn update_status(&mut self, status: WorkflowStatus) {
        self.status = status;
        self.updated_at = Utc::now();
        
        if status == WorkflowStatus::Completed {
            self.completed_date = Some(Utc::now());
        }
    }
}

/// Workflow index for tracking all workflows
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowIndex {
    pub workflows: HashMap<String, WorkflowIndexEntry>,
    pub last_updated: DateTime<Utc>,
}

/// Entry in the workflow index
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowIndexEntry {
    pub id: String,
    pub title: String,
    pub workflow_type: WorkflowType,
    pub status: WorkflowStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub assigned_to: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub parcel_ids: Vec<String>,
}

impl WorkflowIndex {
    /// Create a new empty workflow index
    pub fn new() -> Self {
        Self {
            workflows: HashMap::new(),
            last_updated: Utc::now(),
        }
    }
    
    /// Load workflow index from file
    pub fn load() -> Result<Self, Box<dyn Error>> {
        let path = Path::new(WORKFLOW_INDEX_PATH);
        
        // Create empty index if file doesn't exist
        if !path.exists() {
            let empty_index = Self::new();
            empty_index.save()?;
            return Ok(empty_index);
        }
        
        // Read and parse the index file
        let index_content = fs::read_to_string(path)?;
        let index: WorkflowIndex = serde_json::from_str(&index_content)?;
        
        Ok(index)
    }
    
    /// Save workflow index to file
    pub fn save(&self) -> Result<(), Box<dyn Error>> {
        // Create directory if it doesn't exist
        let path = Path::new(WORKFLOW_INDEX_PATH);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        // Serialize and save the index
        let index_content = serde_json::to_string_pretty(self)?;
        fs::write(path, index_content)?;
        
        Ok(())
    }
    
    /// Add workflow to the index
    pub fn add_workflow(&mut self, workflow: &Workflow) -> Result<(), Box<dyn Error>> {
        // Create index entry
        let entry = WorkflowIndexEntry {
            id: workflow.id.clone(),
            title: workflow.title.clone(),
            workflow_type: workflow.workflow_type.clone(),
            status: workflow.status.clone(),
            created_at: workflow.created_at,
            updated_at: workflow.updated_at,
            assigned_to: workflow.assigned_to.clone(),
            due_date: workflow.due_date,
            parcel_ids: workflow.parcel_ids.clone(),
        };
        
        // Add to index
        self.workflows.insert(workflow.id.clone(), entry);
        self.last_updated = Utc::now();
        
        // Save updated index
        self.save()?;
        
        Ok(())
    }
    
    /// Update workflow in the index
    pub fn update_workflow(&mut self, workflow: &Workflow) -> Result<(), Box<dyn Error>> {
        // Check if workflow exists
        if !self.workflows.contains_key(&workflow.id) {
            return Err(format!("Workflow not found: {}", workflow.id).into());
        }
        
        // Update index entry
        let entry = WorkflowIndexEntry {
            id: workflow.id.clone(),
            title: workflow.title.clone(),
            workflow_type: workflow.workflow_type.clone(),
            status: workflow.status.clone(),
            created_at: workflow.created_at,
            updated_at: workflow.updated_at,
            assigned_to: workflow.assigned_to.clone(),
            due_date: workflow.due_date,
            parcel_ids: workflow.parcel_ids.clone(),
        };
        
        // Update index
        self.workflows.insert(workflow.id.clone(), entry);
        self.last_updated = Utc::now();
        
        // Save updated index
        self.save()?;
        
        Ok(())
    }
    
    /// Get all workflows in the index
    pub fn get_all_workflows(&self) -> Vec<WorkflowIndexEntry> {
        self.workflows.values().cloned().collect()
    }
    
    /// Get workflows by parcel ID
    pub fn get_workflows_by_parcel(&self, parcel_id: &str) -> Vec<WorkflowIndexEntry> {
        self.workflows.values()
            .filter(|entry| entry.parcel_ids.contains(&parcel_id.to_string()))
            .cloned()
            .collect()
    }
    
    /// Get workflows by status
    pub fn get_workflows_by_status(&self, status: WorkflowStatus) -> Vec<WorkflowIndexEntry> {
        self.workflows.values()
            .filter(|entry| entry.status == status)
            .cloned()
            .collect()
    }
    
    /// Get workflows by type
    pub fn get_workflows_by_type(&self, workflow_type: WorkflowType) -> Vec<WorkflowIndexEntry> {
        self.workflows.values()
            .filter(|entry| entry.workflow_type == workflow_type)
            .cloned()
            .collect()
    }
    
    /// Get workflows by assigned user
    pub fn get_workflows_by_user(&self, user_id: &str) -> Vec<WorkflowIndexEntry> {
        self.workflows.values()
            .filter(|entry| match &entry.assigned_to {
                Some(assigned) => assigned == user_id,
                None => false,
            })
            .cloned()
            .collect()
    }
}

/// Load a workflow by ID
pub fn load_workflow(workflow_id: &str) -> Result<Workflow, Box<dyn Error>> {
    // Construct file path
    let file_path = Path::new(WORKFLOW_DATA_PATH).join(format!("{}.json", workflow_id));
    
    // Check if file exists
    if !file_path.exists() {
        return Err(format!("Workflow not found: {}", workflow_id).into());
    }
    
    // Read and parse workflow file
    let workflow_content = fs::read_to_string(file_path)?;
    let workflow: Workflow = serde_json::from_str(&workflow_content)?;
    
    Ok(workflow)
}

/// Save a workflow to storage
pub fn save_workflow(workflow: &Workflow) -> Result<(), Box<dyn Error>> {
    // Create workflow directory if it doesn't exist
    let workflow_dir = Path::new(WORKFLOW_DATA_PATH);
    fs::create_dir_all(workflow_dir)?;
    
    // Serialize workflow to JSON
    let workflow_content = serde_json::to_string_pretty(workflow)?;
    
    // Save workflow file
    let file_path = workflow_dir.join(format!("{}.json", workflow.id));
    fs::write(file_path, workflow_content)?;
    
    // Update workflow index
    let mut index = WorkflowIndex::load()?;
    
    if index.workflows.contains_key(&workflow.id) {
        index.update_workflow(workflow)?;
    } else {
        index.add_workflow(workflow)?;
    }
    
    Ok(())
}

/// Create a template workflow of the specified type
pub fn create_workflow_template(title: &str, workflow_type: WorkflowType, description: Option<&str>) -> Result<Workflow, Box<dyn Error>> {
    let mut workflow = Workflow::new(title, workflow_type.clone(), description);
    
    // Add steps based on workflow type
    match workflow_type {
        WorkflowType::DeedProcessing => {
            workflow.add_step(WorkflowStep::new("Document Intake", Some("Receive and log the deed document")));
            workflow.add_step(WorkflowStep::new("Document Validation", Some("Verify document completeness and signatures")));
            workflow.add_step(WorkflowStep::new("Property Identification", Some("Identify affected properties")));
            workflow.add_step(WorkflowStep::new("Update Property Records", Some("Update ownership records in the system")));
            workflow.add_step(WorkflowStep::new("Quality Control", Some("Review changes for accuracy")));
            workflow.add_step(WorkflowStep::new("Final Approval", Some("Approve and finalize changes")));
        },
        WorkflowType::BoundaryLineAdjustment => {
            workflow.add_step(WorkflowStep::new("Application Intake", Some("Receive and log BLA application")));
            workflow.add_step(WorkflowStep::new("Initial Review", Some("Verify application completeness")));
            workflow.add_step(WorkflowStep::new("Property Identification", Some("Identify affected properties")));
            workflow.add_step(WorkflowStep::new("Survey Review", Some("Review provided survey documents")));
            workflow.add_step(WorkflowStep::new("GIS Update Preparation", Some("Prepare GIS updates")));
            workflow.add_step(WorkflowStep::new("Record Updates", Some("Update property records")));
            workflow.add_step(WorkflowStep::new("Final Review", Some("Final review of all changes")));
            workflow.add_step(WorkflowStep::new("Notification", Some("Notify property owners of completion")));
        },
        WorkflowType::PlatReview => {
            workflow.add_step(WorkflowStep::new("Plat Submission", Some("Receive and log plat submission")));
            workflow.add_step(WorkflowStep::new("Completeness Check", Some("Verify all required elements are present")));
            workflow.add_step(WorkflowStep::new("Technical Review", Some("Review technical aspects of the plat")));
            workflow.add_step(WorkflowStep::new("Standards Compliance", Some("Verify compliance with standards")));
            workflow.add_step(WorkflowStep::new("GIS Integration Planning", Some("Plan GIS database updates")));
            workflow.add_step(WorkflowStep::new("Revision Request", Some("Request revisions if needed")));
            workflow.add_step(WorkflowStep::new("Final Approval", Some("Final approval of plat")));
            workflow.add_step(WorkflowStep::new("Record Integration", Some("Integrate into county records")));
        },
        WorkflowType::PropertySplit => {
            workflow.add_step(WorkflowStep::new("Application Receipt", Some("Receive property split application")));
            workflow.add_step(WorkflowStep::new("Document Verification", Some("Verify application documents")));
            workflow.add_step(WorkflowStep::new("Parcel Identification", Some("Identify parent parcel")));
            workflow.add_step(WorkflowStep::new("Split Validation", Some("Validate split requirements")));
            workflow.add_step(WorkflowStep::new("New Parcel Creation", Some("Create new parcel records")));
            workflow.add_step(WorkflowStep::new("Map Update", Some("Update GIS maps with new parcels")));
            workflow.add_step(WorkflowStep::new("Legal Description Review", Some("Review legal descriptions")));
            workflow.add_step(WorkflowStep::new("Final Approval", Some("Final approval of split")));
            workflow.add_step(WorkflowStep::new("Record Update", Some("Update official records")));
        },
        WorkflowType::AddressAssignment => {
            workflow.add_step(WorkflowStep::new("Request Intake", Some("Receive address assignment request")));
            workflow.add_step(WorkflowStep::new("Property Verification", Some("Verify property information")));
            workflow.add_step(WorkflowStep::new("Address Determination", Some("Determine appropriate address")));
            workflow.add_step(WorkflowStep::new("GIS Update", Some("Update GIS with new address")));
            workflow.add_step(WorkflowStep::new("Notification Preparation", Some("Prepare notification documents")));
            workflow.add_step(WorkflowStep::new("Record Update", Some("Update official records")));
            workflow.add_step(WorkflowStep::new("Notification", Some("Notify requestor and agencies")));
        },
        WorkflowType::PropertyAssessment => {
            workflow.add_step(WorkflowStep::new("Assessment Initiation", Some("Initiate assessment process")));
            workflow.add_step(WorkflowStep::new("Property Identification", Some("Identify properties for assessment")));
            workflow.add_step(WorkflowStep::new("Data Collection", Some("Collect property data")));
            workflow.add_step(WorkflowStep::new("Property Inspection", Some("Conduct physical inspection")));
            workflow.add_step(WorkflowStep::new("Value Analysis", Some("Analyze property value")));
            workflow.add_step(WorkflowStep::new("Initial Valuation", Some("Determine initial property value")));
            workflow.add_step(WorkflowStep::new("Quality Review", Some("Review assessment for accuracy")));
            workflow.add_step(WorkflowStep::new("Value Finalization", Some("Finalize property value")));
            workflow.add_step(WorkflowStep::new("Notice Preparation", Some("Prepare value notice")));
            workflow.add_step(WorkflowStep::new("Record Update", Some("Update assessment records")));
        },
        WorkflowType::RecordUpdate => {
            workflow.add_step(WorkflowStep::new("Update Request", Some("Receive record update request")));
            workflow.add_step(WorkflowStep::new("Request Validation", Some("Validate update request")));
            workflow.add_step(WorkflowStep::new("Record Identification", Some("Identify records to update")));
            workflow.add_step(WorkflowStep::new("Update Processing", Some("Process the record update")));
            workflow.add_step(WorkflowStep::new("Quality Control", Some("Verify update accuracy")));
            workflow.add_step(WorkflowStep::new("Finalization", Some("Finalize the update")));
            workflow.add_step(WorkflowStep::new("Notification", Some("Notify relevant parties")));
        },
        WorkflowType::ExemptionRequest => {
            workflow.add_step(WorkflowStep::new("Application Receipt", Some("Receive exemption application")));
            workflow.add_step(WorkflowStep::new("Application Review", Some("Review application for completeness")));
            workflow.add_step(WorkflowStep::new("Property Verification", Some("Verify property information")));
            workflow.add_step(WorkflowStep::new("Eligibility Assessment", Some("Assess exemption eligibility")));
            workflow.add_step(WorkflowStep::new("Documentation Review", Some("Review supporting documentation")));
            workflow.add_step(WorkflowStep::new("Determination", Some("Make exemption determination")));
            workflow.add_step(WorkflowStep::new("Record Update", Some("Update records with exemption")));
            workflow.add_step(WorkflowStep::new("Notification", Some("Notify applicant of decision")));
        },
    }
    
    Ok(workflow)
}

/// Get active workflows (excluding completed and rejected)
pub fn get_active_workflows() -> Result<Vec<Workflow>, Box<dyn Error>> {
    let index = WorkflowIndex::load()?;
    
    let active_entries = index.workflows.values().filter(|entry| {
        entry.status != WorkflowStatus::Completed && entry.status != WorkflowStatus::Rejected
    });
    
    let mut workflows = Vec::new();
    for entry in active_entries {
        match load_workflow(&entry.id) {
            Ok(workflow) => workflows.push(workflow),
            Err(e) => error!("Failed to load workflow {}: {}", entry.id, e),
        }
    }
    
    Ok(workflows)
}

/// Get workflows due in the next N days
pub fn get_upcoming_workflows(days: u32) -> Result<Vec<Workflow>, Box<dyn Error>> {
    let index = WorkflowIndex::load()?;
    let now = Utc::now();
    let deadline = now + chrono::Duration::days(days as i64);
    
    let upcoming_entries = index.workflows.values().filter(|entry| {
        if let Some(due_date) = entry.due_date {
            due_date <= deadline && 
            entry.status != WorkflowStatus::Completed && 
            entry.status != WorkflowStatus::Rejected
        } else {
            false
        }
    });
    
    let mut workflows = Vec::new();
    for entry in upcoming_entries {
        match load_workflow(&entry.id) {
            Ok(workflow) => workflows.push(workflow),
            Err(e) => error!("Failed to load workflow {}: {}", entry.id, e),
        }
    }
    
    Ok(workflows)
}

/// Get workflows by parcel ID
pub fn get_workflows_for_parcel(parcel_id: &str) -> Result<Vec<Workflow>, Box<dyn Error>> {
    let index = WorkflowIndex::load()?;
    
    let parcel_entries = index.get_workflows_by_parcel(parcel_id);
    
    let mut workflows = Vec::new();
    for entry in parcel_entries {
        match load_workflow(&entry.id) {
            Ok(workflow) => workflows.push(workflow),
            Err(e) => error!("Failed to load workflow {}: {}", entry.id, e),
        }
    }
    
    Ok(workflows)
}

/// Initialize the workflow system
pub fn initialize_workflow_system() -> Result<(), Box<dyn Error>> {
    info!("Initializing workflow management system");
    
    // Create workflow directory if it doesn't exist
    let workflow_dir = Path::new(WORKFLOW_DATA_PATH);
    fs::create_dir_all(workflow_dir)?;
    
    // Create or load workflow index
    let index = WorkflowIndex::load()?;
    
    info!("Workflow system initialized with {} workflows", index.workflows.len());
    
    Ok(())
}