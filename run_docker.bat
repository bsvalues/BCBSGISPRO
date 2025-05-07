@echo off
echo Starting BentonGeoPro Sync Dashboard...

REM Check if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed or not in PATH. Please install Docker Desktop.
    echo Visit: https://www.docker.com/products/docker-desktop/
    pause
    exit /b
)

REM Create log directories if they don't exist
if not exist logs mkdir logs
if not exist uploads mkdir uploads

REM Build and run the Docker container
echo Building and starting Docker container...
docker-compose up -d

REM Wait for the container to start
timeout /t 5 /nobreak

REM Open the browser
echo Opening browser...
start http://localhost:8000

echo.
echo BentonGeoPro Sync Dashboard is running.
echo The web interface is available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the Docker container
echo.

REM Show the container logs
docker-compose logs -f