#!/bin/bash

# Build script for Benton County GIS Rust application

echo "Building Benton County GIS Rust application..."

# Make sure directories exist
mkdir -p benton_gis_rust/public
mkdir -p benton_gis_rust/data
mkdir -p uploads

# Build the Rust application
cd benton_gis_rust && cargo build

# Run the application (blocking call)
cd benton_gis_rust && cargo run