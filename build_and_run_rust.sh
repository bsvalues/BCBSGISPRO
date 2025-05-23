#!/bin/bash

# TerraFusion Platform Build & Run Script with ACI.dev

echo "🚀 TerraFusion Platform - Build & Run Script (ACI.dev)"
echo "======================================================"

# Create necessary directories
mkdir -p benton_gis_rust/templates
mkdir -p benton_gis_rust/static/css
mkdir -p benton_gis_rust/data/documents

# Copy templates and other needed files
echo "📂 Setting up directories..."
cp -r client/src/assets/* benton_gis_rust/static/ 2>/dev/null || true
cp -r public/* benton_gis_rust/static/ 2>/dev/null || true
cp -r benton_gis_rust/templates/*.html benton_gis_rust/templates/ 2>/dev/null || true

# Copy the environment variables
echo "📄 Setting up environment..."
if [ -f .env ]; then
  cp .env benton_gis_rust/
fi

# Change to Rust directory and build the application
echo "🔨 Building Rust application with ACI.dev..."
cd benton_gis_rust

# Check if Cargo is installed
if ! command -v cargo &> /dev/null; then
  echo "❌ Cargo is not installed. Please install Rust and Cargo to continue."
  exit 1
fi

# Update dependencies to ensure ACI.dev is properly installed
echo "📦 Updating dependencies..."
cargo update

# Build the Rust application with ACI.dev
cargo build --release

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please check the error messages above."
  exit 1
fi

echo "✅ Build successful!"
echo "🚀 Starting TerraFusion Platform (Rust with ACI.dev)..."
echo "======================================================"

# Run the Rust application
RUST_LOG=info cargo run --release

# Keep terminal open if there's an error
if [ $? -ne 0 ]; then
  echo "❌ Application crashed. See error messages above."
  echo "Press Enter to close this window..."
  read
fi