#!/bin/bash

echo "Starting BentonGeoPro Sync Dashboard..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Create log directories if they don't exist
mkdir -p logs uploads

# Build and run the Docker container
echo "Building and starting Docker container..."
docker-compose up -d

# Wait for the container to start
sleep 5

# Open the browser
echo "Opening browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:8000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000
    elif command -v gnome-open &> /dev/null; then
        gnome-open http://localhost:8000
    else
        echo "Could not open browser automatically."
        echo "Please visit: http://localhost:8000"
    fi
fi

echo ""
echo "BentonGeoPro Sync Dashboard is running."
echo "The web interface is available at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the Docker container"
echo ""

# Show the container logs
docker-compose logs -f