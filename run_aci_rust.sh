#!/bin/bash

# TerraFusion Platform ACI.dev Runner
echo "🚀 TerraFusion Platform - ACI.dev Runner"
echo "======================================"

# Create necessary directories
mkdir -p benton_gis_rust/templates
mkdir -p benton_gis_rust/static/css
mkdir -p benton_gis_rust/data/documents

# Copy templates and static assets
echo "📂 Setting up static assets..."
cp -r client/src/assets/* benton_gis_rust/static/ 2>/dev/null || true
cp -r public/* benton_gis_rust/static/ 2>/dev/null || true
cp -r benton_gis_rust/templates/*.html benton_gis_rust/templates/ 2>/dev/null || true

# Copy environment variables
echo "📄 Setting up environment..."
if [ -f .env ]; then
  cp .env benton_gis_rust/
fi

# Navigate to Rust directory
cd benton_gis_rust || exit

# Check if cargo is available
if ! command -v cargo &> /dev/null; then
  echo "❌ Error: Rust and Cargo are required but not installed."
  echo "Please install Rust from https://rustup.rs/"
  exit 1
fi

# Run the application using cargo
echo "🚀 Starting TerraFusion Platform with ACI.dev..."
echo "==============================================="
cargo run --release

# Handle exit status
if [ $? -ne 0 ]; then
  echo "❌ Application terminated with an error."
  exit 1
fi