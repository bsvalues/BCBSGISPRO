# Benton County GIS Application - Rust Backend

This is the Rust implementation of the Benton County Geographic Information System (GIS) workflow solution for the Assessor's Office. This project is part of a migration from TypeScript/JavaScript to Rust for improved performance and security.

## Project Structure

- `src/` - Rust source code
  - `models/` - Data models for GIS features, documents, etc.
  - `handlers/` - API request handlers
  - `services/` - Business logic and services
  - `utils/` - Helper utilities
  - `main.rs` - Application entry point
  - `lib.rs` - Library exports

- `public/` - Static files for web frontend
  - `index.html` - Landing page
  - `assets/` - CSS, JavaScript, and other assets

## Features

- RESTful API for GIS feature management
- Document classification and management
- Integration with the existing React frontend
- PostgreSQL database integration

## API Endpoints

### GIS Features
- `GET /api/features` - Get all GIS features
- `POST /api/features` - Create a new GIS feature
- `GET /api/features/{id}` - Get a specific GIS feature
- `PUT /api/features/{id}` - Update a GIS feature
- `DELETE /api/features/{id}` - Delete a GIS feature

### Document Management
- `POST /api/documents/classify` - Classify a document
- `POST /api/documents/upload` - Upload a document
- `GET /api/documents/{id}` - Get document details

### System
- `GET /api/health` - Check API health

## Development

### Prerequisites
- Rust (latest stable)
- Cargo package manager
- PostgreSQL database

### Building
```
cargo build
```

### Running
```
cargo run
```

The server will start on port 8080 by default (configurable with the PORT environment variable).

## Transition Plan

1. Phase 1: Create a standalone Rust backend with API endpoints ✅
2. Phase 2: Integrate existing database models
3. Phase 3: Connect the React frontend to the Rust backend
4. Phase 4: Migrate additional functionality
5. Phase 5: Performance tuning and scaling

## Next Steps

- Add database integration using SQLx
- Implement proper error handling
- Add authentication and authorization
- Set up WebSocket support for real-time collaboration
- Create integration tests