#!/bin/bash

# Build Distribution Package for BentonGeoPro Sync Dashboard
# This script creates a distributable package with both Docker and Windows installations

echo "Building distribution package..."

# Create dist directory
mkdir -p dist

# Create Docker package
echo "Creating Docker package..."
mkdir -p dist/docker
cp -r server dist/docker/
cp Dockerfile dist/docker/
cp docker-compose.yml dist/docker/
cp run_docker.bat dist/docker/
cp run_docker.sh dist/docker/
cp README.md dist/docker/
chmod +x dist/docker/run_docker.sh

# Create Windows package
echo "Creating Windows package..."
mkdir -p dist/windows
cp -r windows_build/* dist/windows/
cp -r server dist/windows/
cp README.md dist/windows/

# Create HTML user guide (can be converted to PDF)
echo "Copying documentation..."
cp ICSF_Admin_Dashboard_Guide.html dist/

# Create a zip archive
echo "Creating zip archive..."
cd dist
zip -r BentonGeoPro_Sync_Dashboard.zip docker windows ICSF_Admin_Dashboard_Guide.html
cd ..

echo "Distribution package ready!"
echo "You can find it at: dist/BentonGeoPro_Sync_Dashboard.zip"