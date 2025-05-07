# BentonGeoPro Sync Dashboard

This repository contains a Property Data Synchronization Dashboard for the Benton County Assessor's Office. The system enables ICSF-compliant property data management with:

- ✅ RBAC role enforcement (Assessor, Staff, ITAdmin, Auditor)
- ✅ Secure file upload with SHA-256 verification
- ✅ Approval & rollback logic
- ✅ Visual diff viewing with highlighted deltas
- ✅ Activity display by role
- ✅ Audit-safe log routing

## Deployment Options

### Option 1: Docker Container (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- For Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- For Mac/Linux: [Docker Engine](https://docs.docker.com/engine/install/)

#### Quick Start
1. Clone this repository
2. Run the start script for your platform:
   - Windows: Double-click `run_docker.bat`
   - Mac/Linux: Run `./run_docker.sh` (you may need to make it executable with `chmod +x run_docker.sh`)
3. Access the dashboard at: http://localhost:8000

#### Manual Start
```bash
# Create necessary directories
mkdir -p logs uploads

# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 2: Windows Standalone Executable

#### Prerequisites
- Windows 7/8/10/11

#### Installation
1. Download and run the `BentonGeoProSyncDashboard.exe` executable
2. The application will start and open a browser window automatically
3. Access the dashboard at: http://localhost:8000

#### Building the Windows Executable (for developers)
1. Make sure Python 3.8+ is installed
2. Navigate to the `windows_build` directory
3. Run `build_installer.bat`
4. The executable will be created in the project root directory

## Authentication

The system uses authentication tokens for RBAC (Role-Based Access Control). Available credentials:

| Token | Role | Permissions |
|-------|------|-------------|
| `CO\jdoe` | Assessor | view, approve, diff |
| `CO\mjohnson` | Staff | view, upload |
| `CO\bsmith` | ITAdmin | view, upload, approve, rollback, export, diff |
| `CO\tauditor` | Auditor | view, diff |

## Data Handling

- All uploads are secured with SHA-256 hash verification
- File contents are parsed to extract property IDs
- Diff views highlight changes between current and proposed values
- Audit logs track all approvals and rollbacks

## Development

This application consists of two implementations:
1. A Python FastAPI backend (this README focuses on this implementation)
2. A JavaScript/React implementation (available in the same repository)

Both implementations provide similar functionality with different technology stacks.

To modify the Python implementation:
1. Edit files in the `server` directory
2. Rebuild the Docker container with `docker-compose build`

## License

Proprietary - Benton County Assessor's Office © 2025