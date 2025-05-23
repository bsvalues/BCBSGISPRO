#!/bin/bash

# TerraFusion Platform - Demo Setup Script
# This script sets up a simple demo of the Rust application

echo "🚀 Setting up TerraFusion Platform Demo (Rust)"
echo "=============================================="

# Create necessary directory structure
mkdir -p static/css data/documents

# Copy the CSS file if it doesn't exist
if [ ! -f "static/css/main.css" ]; then
  echo "/* TerraFusion Platform Base Styles */
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Print styles */
@media print {
    .nav-links, .action-buttons {
        display: none;
    }
}" > static/css/main.css
fi

# Setup a simple web server to serve our HTML templates
echo "Starting a simple HTTP server to demonstrate the templates..."
echo "This is a demo of the UI templates we've created for the Rust version"
echo "Open your browser at http://localhost:8000 to view the application"
echo ""
echo "Available pages:"
echo "  • Home:       http://localhost:8000/benton_gis_rust/src/web/templates/index.html"
echo "  • Map:        http://localhost:8000/benton_gis_rust/src/web/templates/map.html"
echo "  • Documents:  http://localhost:8000/benton_gis_rust/src/web/templates/documents.html"
echo "  • Workflows:  http://localhost:8000/benton_gis_rust/src/web/templates/workflows.html"
echo "  • Dashboard:  http://localhost:8000/benton_gis_rust/src/web/templates/dashboard.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=============================================="

# Start a simple HTTP server
python3 -m http.server 8000