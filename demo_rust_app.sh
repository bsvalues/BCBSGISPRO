#!/bin/bash

# TerraFusion Platform - Run Rust Application
# This script makes it easy to run the Rust version of the application

echo "🚀 Starting TerraFusion Platform (Rust Version)"
echo "==============================================="

# Check if Rust/Cargo is installed
if ! command -v cargo &> /dev/null; then
  echo "❌ Error: Rust and Cargo are required but not installed."
  echo "Please install Rust from https://rustup.rs/"
  exit 1
fi

# Make script executable
chmod +x build_and_run_rust.sh

# Run the build and run script
./build_and_run_rust.sh