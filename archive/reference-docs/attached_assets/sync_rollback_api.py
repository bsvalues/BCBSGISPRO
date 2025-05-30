
from fastapi import FastAPI, HTTPException, Depends, Form
import pandas as pd
import os
from rbac_auth import check_permission

app = FastAPI()

LOG_DIR = "logs"
STAGING_FILE = os.path.join(LOG_DIR, "staging_area.csv")
AUDIT_FILE = os.path.join(LOG_DIR, "approved_changes.csv")
ROLLBACK_FILE = os.path.join(LOG_DIR, "rollback_log.csv")

os.makedirs(LOG_DIR, exist_ok=True)

@app.post("/rollback")
def rollback(upload_id: str = Form(...), user=Depends(check_permission("rollback"))):
    if not os.path.exists(AUDIT_FILE):
        raise HTTPException(status_code=404, detail="Audit log not found")

    audit_df = pd.read_csv(AUDIT_FILE)
    match = audit_df[audit_df["upload_id"] == upload_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Upload ID not found in audit log")

    # Remove from audit file (soft delete)
    audit_df = audit_df[audit_df["upload_id"] != upload_id]
    audit_df.to_csv(AUDIT_FILE, index=False)

    # Log rollback action
    if os.path.exists(ROLLBACK_FILE):
        match.to_csv(ROLLBACK_FILE, mode="a", header=False, index=False)
    else:
        match.to_csv(ROLLBACK_FILE, index=False)

    return {"status": "rolled back", "upload_id": upload_id}
