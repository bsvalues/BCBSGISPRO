#!/bin/bash

# TerraFusion Platform - Run Rust Application with ACI.dev
# This script makes it easy to run the Rust version of the application with ACI.dev

echo "🚀 Starting TerraFusion Platform (Rust with ACI.dev)"
echo "===================================================="

# Check if Rust/Cargo is installed
if ! command -v cargo &> /dev/null; then
  echo "❌ Error: Rust and Cargo are required but not installed."
  echo "Please install Rust from https://rustup.rs/"
  exit 1
fi

# Make scripts executable
chmod +x build_and_run_rust.sh
chmod +x run_aci_rust.sh

# Run the ACI.dev version
echo "Starting TerraFusion Platform with ACI.dev WebSocket support..."
echo "------------------------------------------------------------"
echo "WebSocket endpoint will be available at: ws://localhost:8080/ws"
echo "REST API endpoints will be available at: http://localhost:8080/api/*"
echo "------------------------------------------------------------"

# Run the build and run script
./run_aci_rust.sh