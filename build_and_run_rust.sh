#!/bin/bash

# TerraFusion Platform Build & Run Script

echo "🚀 TerraFusion Platform - Build & Run Script"
echo "==========================================="

# Create necessary directories
mkdir -p benton_gis_rust/templates
mkdir -p static/css
mkdir -p data/documents

# Copy templates to the proper location
echo "📂 Setting up template directories..."
cp -r benton_gis_rust/src/web/templates/* benton_gis_rust/templates/

# Run the demo script to serve HTML templates
echo "🌐 Starting web server for TerraFusion Platform..."
echo "Open your browser at http://localhost:8000 to view the application"
echo ""
echo "Available pages:"
echo "  • Home:       http://localhost:8000/benton_gis_rust/src/web/templates/index.html"
echo "  • Workflows:  http://localhost:8000/benton_gis_rust/src/web/templates/workflows.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==========================================="

# Start a simple HTTP server
python3 -m http.server 8000