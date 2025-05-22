use rusqlite::{Connection, Result as SqlResult};
use std::path::Path;
use std::sync::{Arc, Mutex};
use log::{info, error};

mod schema;
pub use schema::*;

/// Database manager that handles connections and operations
pub struct DatabaseManager {
    connection: Arc<Mutex<Connection>>,
}

impl DatabaseManager {
    /// Create a new database manager with SQLite connection
    pub fn new(db_path: &Path) -> SqlResult<Self> {
        let connection = Connection::open(db_path)?;
        
        // Initialize the database with our schema
        Self::initialize_database(&connection)?;
        
        info!("Database connection established at {:?}", db_path);
        
        Ok(Self {
            connection: Arc::new(Mutex::new(connection)),
        })
    }
    
    /// Create an in-memory database for testing
    pub fn new_in_memory() -> SqlResult<Self> {
        let connection = Connection::open_in_memory()?;
        
        // Initialize the database with our schema
        Self::initialize_database(&connection)?;
        
        info!("In-memory database created");
        
        Ok(Self {
            connection: Arc::new(Mutex::new(connection)),
        })
    }
    
    /// Initialize database schema
    fn initialize_database(connection: &Connection) -> SqlResult<()> {
        // Create GIS features table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS gis_features (
                id TEXT PRIMARY KEY,
                feature_type TEXT NOT NULL,
                properties TEXT NOT NULL,
                geometry TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                created_by TEXT
            )",
            [],
        )?;
        
        // Create documents table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                classification_type TEXT,
                classification_confidence REAL,
                classification_verified INTEGER,
                classification_date TEXT,
                metadata TEXT NOT NULL,
                uploaded_at TEXT NOT NULL,
                uploaded_by TEXT
            )",
            [],
        )?;
        
        // Create document-parcel relationship table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS document_parcels (
                document_id TEXT NOT NULL,
                parcel_id TEXT NOT NULL,
                PRIMARY KEY (document_id, parcel_id),
                FOREIGN KEY (document_id) REFERENCES documents(id)
            )",
            [],
        )?;
        
        // Create users table
        connection.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                email TEXT,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login TEXT
            )",
            [],
        )?;
        
        info!("Database schema initialized");
        Ok(())
    }
    
    /// Get a clone of the connection for use in operations
    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        self.connection.clone()
    }
}