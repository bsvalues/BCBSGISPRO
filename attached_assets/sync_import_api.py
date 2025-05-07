
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import xml.etree.ElementTree as ET
import hashlib
import os
from datetime import datetime

app = FastAPI()
security = HTTPBearer()

# Define log directory
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

# Token for simulation access
AUTHORIZED_TOKEN = "secure-sync-token"

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != AUTHORIZED_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid or missing token")

def log_sync(file_name, prop_id, sha256_hash, risk="none"):
    now = datetime.utcnow().isoformat()
    log_entry = f"{now}, {file_name}, {prop_id}, {sha256_hash}, {risk}\n"
    with open(os.path.join(LOG_DIR, "sync_import_log.csv"), "a") as f:
        f.write(log_entry)

def extract_prop_id_from_xml(contents):
    try:
        root = ET.fromstring(contents)
        for elem in root.iter():
            if "prop_id" in elem.tag.lower() or (elem.text and "prop_id" in elem.text.lower()):
                return elem.text.strip()
    except:
        return None
    return None

@app.post("/sync/import")
def sync_import(file: UploadFile = File(...), credentials: HTTPAuthorizationCredentials = Depends(security)):
    verify_token(credentials)
    contents = file.file.read()
    sha256 = hashlib.sha256(contents).hexdigest()
    try:
        prop_id = extract_prop_id_from_xml(contents.decode("utf-8"))
    except Exception:
        prop_id = None

    risk = "high" if not prop_id else "none"
    log_sync(file.filename, prop_id or "UNKNOWN", sha256, risk)

    return {
        "status": "received",
        "filename": file.filename,
        "prop_id": prop_id,
        "sha256": sha256,
        "risk_flag": risk
    }
