#!/bin/bash

# Exit on error
set -e

echo "🔨 Building TerraFusion Platform (Rust with ACI.dev)..."
echo "====================================================="

# Change to the Rust project directory
cd benton_gis_rust

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cargo clean

# Update dependencies
echo "📦 Updating dependencies..."
cargo update

# Build the application in release mode
echo "🔧 Compiling Rust application with ACI.dev..."
cargo build --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "====================================================="
    echo "🚀 Starting TerraFusion Platform (Rust with ACI.dev)..."
    echo "====================================================="
    # Run the application
    RUST_LOG=info cargo run --release
else
    echo "❌ Build failed!"
    exit 1
fi