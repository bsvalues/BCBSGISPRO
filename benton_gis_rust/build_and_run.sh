#!/bin/bash

# TerraFusion Platform - Rust Build and Run Script
# Complete migration from JavaScript/TypeScript to Rust

echo "🚀 Building TerraFusion Platform (Rust)"
echo "========================================"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/documents
mkdir -p static/css
mkdir -p static/js

# Set environment variables
export RUST_LOG=info
export DATA_DIR="./data"
export DATABASE_URL="sqlite:./data/benton_gis.db"

# Create basic CSS file if it doesn't exist
if [ ! -f "static/css/main.css" ]; then
    echo "🎨 Creating basic CSS..."
    cat > static/css/main.css << 'EOF'
/* TerraFusion Platform Base Styles */
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
}
EOF
fi

echo "🔧 Building Rust application..."
cargo build --release

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🌟 Starting TerraFusion Platform..."
echo "Platform will be available at: http://localhost:8080"
echo ""
echo "Available endpoints:"
echo "  • Home: http://localhost:8080/"
echo "  • Interactive Map: http://localhost:8080/map"
echo "  • Documents: http://localhost:8080/documents"
echo "  • Workflows: http://localhost:8080/workflows"
echo "  • Dashboard: http://localhost:8080/dashboard"
echo "  • API: http://localhost:8080/api/"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"

# Run the application
cargo run --release