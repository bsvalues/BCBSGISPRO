from fastapi import FastAPI, Request, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import uuid
import hashlib
from datetime import datetime
import shutil
import json

# Import RBAC authentication
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from rbac_auth import get_current_user, check_permission

app = FastAPI(title="BentonGeoPro Sync Dashboard", 
              description="ICSF-compliant property data synchronization system",
              version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Log file paths
STAGING_FILE = os.path.join(LOG_DIR, "staging_area.csv")
AUDIT_FILE = os.path.join(LOG_DIR, "approved_changes.csv")
ROLLBACK_FILE = os.path.join(LOG_DIR, "rollback_log.csv")

# Create directories if they don't exist
for directory in [LOG_DIR, UPLOAD_DIR, STATIC_DIR]:
    os.makedirs(directory, exist_ok=True)

# Ensure base log files exist
for file_path, columns in [
    (STAGING_FILE, ["upload_id", "timestamp", "filename", "sha256", "prop_id", "status", "file_path"]),
    (AUDIT_FILE, ["upload_id", "timestamp", "filename", "sha256", "prop_id", "status", "file_path"]),
    (ROLLBACK_FILE, ["upload_id", "timestamp", "filename", "sha256", "prop_id", "status", "file_path"])
]:
    if not os.path.exists(file_path):
        pd.DataFrame(columns=columns).to_csv(file_path, index=False)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/user")
async def get_user_info(user=Depends(get_current_user)):
    return user

@app.get("/api/sync/staging-data")
async def get_staging_data(user=Depends(check_permission("view"))):
    df = pd.read_csv(STAGING_FILE)
    # Filter out sensitive information
    safe_data = df[["upload_id", "timestamp", "filename", "sha256", "prop_id", "status"]]
    return safe_data.to_dict(orient="records")

@app.post("/api/sync/stage")
async def stage_file(file: UploadFile = File(...), user=Depends(check_permission("upload"))):
    # Save the uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Read the file contents
    with open(file_path, "rb") as f:
        contents = f.read()
    
    # Calculate SHA-256 hash
    sha256 = hashlib.sha256(contents).hexdigest()
    
    # Extract property ID from contents
    text = contents.decode("utf-8", errors="ignore")
    prop_id = "UNKNOWN"
    for line in text.splitlines():
        if "prop_id" in line.lower() or "property_id" in line.lower() or "PropertyID" in line:
            parts = line.split(":")
            if len(parts) > 1:
                prop_id = parts[1].strip()
                break
    
    # Create new staging entry
    upload_id = str(uuid.uuid4())
    df = pd.read_csv(STAGING_FILE)
    new_row = pd.DataFrame([{
        "upload_id": upload_id,
        "timestamp": datetime.now().isoformat(),
        "filename": file.filename,
        "sha256": sha256,
        "prop_id": prop_id,
        "status": "PENDING",
        "file_path": file_path
    }])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(STAGING_FILE, index=False)
    
    return {
        "upload_id": upload_id,
        "timestamp": datetime.now().isoformat(),
        "filename": file.filename,
        "sha256": sha256,
        "prop_id": prop_id,
        "status": "PENDING"
    }

@app.post("/api/sync/import")
async def direct_import(file: UploadFile = File(...), user=Depends(check_permission("upload"))):
    # Save the uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Read the file contents
    with open(file_path, "rb") as f:
        contents = f.read()
    
    # Calculate SHA-256 hash
    sha256 = hashlib.sha256(contents).hexdigest()
    
    # Extract property ID from contents
    text = contents.decode("utf-8", errors="ignore")
    prop_id = "UNKNOWN"
    for line in text.splitlines():
        if "prop_id" in line.lower() or "property_id" in line.lower() or "PropertyID" in line:
            parts = line.split(":")
            if len(parts) > 1:
                prop_id = parts[1].strip()
                break
    
    # Log the import directly to audit log
    upload_id = str(uuid.uuid4())
    df = pd.read_csv(AUDIT_FILE)
    new_row = pd.DataFrame([{
        "upload_id": upload_id,
        "timestamp": datetime.now().isoformat(),
        "filename": file.filename,
        "sha256": sha256,
        "prop_id": prop_id,
        "status": "APPROVED",
        "file_path": file_path
    }])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(AUDIT_FILE, index=False)
    
    return {
        "status": "success",
        "filename": file.filename,
        "prop_id": prop_id,
        "sha256": sha256,
        "risk_flag": "none"
    }

@app.get("/api/sync/diff/{upload_id}")
async def get_diff(upload_id: str, user=Depends(check_permission("diff"))):
    df = pd.read_csv(STAGING_FILE)
    row = df[df["upload_id"] == upload_id]
    
    if row.empty:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    prop_id = row.iloc[0]["prop_id"]
    sha = row.iloc[0]["sha256"]
    file_path = row.iloc[0]["file_path"]
    
    # In a real implementation, we would parse the XML and compare with database values
    # For demo purposes, we'll generate sample data based on the hash
    
    fields = [
        {
            "field": "land_value",
            "current": 150000,
            "proposed": 165000,
            "delta": 15000
        },
        {
            "field": "building_value",
            "current": 320000,
            "proposed": 335000,
            "delta": 15000
        },
        {
            "field": "tax_due",
            "current": 4750,
            "proposed": 5000,
            "delta": 250
        }
    ]
    
    return {
        "prop_id": prop_id,
        "fields": fields
    }

@app.post("/api/sync/approve/{upload_id}")
async def approve_upload(upload_id: str, user=Depends(check_permission("approve"))):
    df = pd.read_csv(STAGING_FILE)
    row = df[df["upload_id"] == upload_id]
    
    if row.empty:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    # Mark as approved in staging
    df.loc[df["upload_id"] == upload_id, "status"] = "APPROVED"
    df.to_csv(STAGING_FILE, index=False)
    
    # Add to audit log
    audit_df = pd.read_csv(AUDIT_FILE)
    approved_row = row.copy()
    audit_df = pd.concat([audit_df, approved_row], ignore_index=True)
    audit_df.to_csv(AUDIT_FILE, index=False)
    
    return {
        "status": "success",
        "message": "Upload approved and processed"
    }

@app.post("/api/sync/rollback")
async def rollback_upload(upload_id: str = Form(...), user=Depends(check_permission("rollback"))):
    audit_df = pd.read_csv(AUDIT_FILE)
    row = audit_df[audit_df["upload_id"] == upload_id]
    
    if row.empty:
        raise HTTPException(status_code=404, detail="Upload not found in audit log")
    
    # Remove from audit log
    audit_df = audit_df[audit_df["upload_id"] != upload_id]
    audit_df.to_csv(AUDIT_FILE, index=False)
    
    # Add to rollback log
    rollback_df = pd.read_csv(ROLLBACK_FILE)
    rollback_df = pd.concat([rollback_df, row], ignore_index=True)
    rollback_df.to_csv(ROLLBACK_FILE, index=False)
    
    return {
        "status": "success",
        "message": "Upload has been rolled back successfully"
    }

@app.get("/api/sync/export")
async def export_logs(user=Depends(check_permission("export"))):
    # Create a CSV with combined logs
    staging_df = pd.read_csv(STAGING_FILE)
    audit_df = pd.read_csv(AUDIT_FILE)
    rollback_df = pd.read_csv(ROLLBACK_FILE)
    
    # Add a type column to distinguish the logs
    staging_df["log_type"] = "staged"
    audit_df["log_type"] = "approved"
    rollback_df["log_type"] = "rolled_back"
    
    # Combine logs
    combined_df = pd.concat([staging_df, audit_df, rollback_df], ignore_index=True)
    
    # Remove file_path for security
    if "file_path" in combined_df.columns:
        combined_df = combined_df.drop(columns=["file_path"])
    
    # Sort by timestamp
    combined_df = combined_df.sort_values("timestamp", ascending=False)
    
    # Write to temp file
    export_path = os.path.join(LOG_DIR, "export_temp.csv")
    combined_df.to_csv(export_path, index=False)
    
    return FileResponse(
        path=export_path,
        filename="sync_import_log.csv",
        media_type="text/csv"
    )

# Copy rbac_auth.py to server directory
if not os.path.exists(os.path.join(BASE_DIR, "rbac_auth.py")):
    source_file = os.path.join(os.path.dirname(BASE_DIR), "attached_assets", "rbac_auth.py")
    if os.path.exists(source_file):
        shutil.copy(source_file, os.path.join(BASE_DIR, "rbac_auth.py"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)