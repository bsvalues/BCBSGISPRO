#!/bin/bash

# Script to debug issues with database integration tests
# This script isolates specific issues with test failures

set -e

function test_db_connection() {
  echo "🔍 Testing database connection..."
  if psql "$DATABASE_URL" -c '\conninfo'; then
    echo "✓ Database connection successful!"
  else
    echo "❌ Database connection failed!"
    exit 1
  fi
}

function test_map_layers() {
  echo "🔍 Testing map layers API logic..."
  
  # Test that the map layers endpoint correctly handles opacity values
  npx jest __tests__/map-layer-opacity.test.ts
}

function test_workflow_events() {
  echo "🔍 Testing workflow events database operations..."
  
  # Check if workflow_events table exists
  if ! psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_events');" | grep -q t; then
    echo "❌ workflow_events table does not exist!"
    exit 1
  fi
  
  # Attempt to insert and retrieve a workflow event
  event_id=$(psql "$DATABASE_URL" -t -c "
    INSERT INTO workflow_events (workflow_id, event_type, event_data, created_at) 
    VALUES (1, 'test_event', '{\"test\": true}', NOW()) 
    RETURNING id;
  ")
  
  if [ -z "$event_id" ]; then
    echo "❌ Failed to insert workflow event!"
    exit 1
  fi
  
  echo "✓ Successfully inserted workflow event with ID: $event_id"
  
  # Retrieve the event
  psql "$DATABASE_URL" -c "SELECT * FROM workflow_events WHERE id = $event_id;"
}

function run_document_tests() {
  echo "🔍 Testing document classification..."
  
  # Test document classification 
  npx jest __tests__/document-classification.test.ts
}

function check_map_layer_opacity() {
  echo "🔍 Checking map layer opacity values in database..."
  
  # Get all map layers and their opacity values
  psql "$DATABASE_URL" -c "SELECT id, name, visible, opacity, zindex, order FROM map_layers ORDER BY order;"
  
  # Check for null opacity values
  null_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM map_layers WHERE opacity IS NULL;" | tr -d ' ')
  if [ "$null_count" -gt 0 ]; then
    echo "⚠️ Found $null_count map layers with null opacity values!"
    
    # Update null opacity values to default (100)
    psql "$DATABASE_URL" -c "UPDATE map_layers SET opacity = 100 WHERE opacity IS NULL;"
    echo "✓ Updated null opacity values to default (100)"
  else
    echo "✓ No map layers with null opacity values found"
  fi
  
  # Check for invalid opacity values (outside 0-100 range)
  invalid_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM map_layers WHERE opacity < 0 OR opacity > 100;" | tr -d ' ')
  if [ "$invalid_count" -gt 0 ]; then
    echo "⚠️ Found $invalid_count map layers with invalid opacity values (outside 0-100 range)!"
    
    # Fix invalid opacity values
    psql "$DATABASE_URL" -c "
      UPDATE map_layers 
      SET opacity = 
        CASE 
          WHEN opacity < 0 THEN 0 
          WHEN opacity > 100 THEN 100 
          ELSE opacity 
        END 
      WHERE opacity < 0 OR opacity > 100;
    "
    echo "✓ Fixed invalid opacity values to be within valid range (0-100)"
  else
    echo "✓ All map layer opacity values are within valid range (0-100)"
  fi
}

function help() {
  echo "Usage: $0 [option]"
  echo "Options:"
  echo "  db        Test database connection"
  echo "  map       Test map layers"
  echo "  events    Test workflow events"
  echo "  docs      Test document classification"
  echo "  opacity   Check and fix map layer opacity values"
  echo "  all       Run all tests"
  echo "  help      Show this help message"
}

# Main function
function main() {
  case $1 in
    "db")
      test_db_connection
      ;;
    "map")
      test_map_layers
      ;;
    "events")
      test_workflow_events
      ;;
    "docs")
      run_document_tests
      ;;
    "opacity")
      check_map_layer_opacity
      ;;
    "all")
      test_db_connection
      test_map_layers
      test_workflow_events
      run_document_tests
      check_map_layer_opacity
      ;;
    "help")
      help
      ;;
    *)
      echo "Unknown option: $1"
      help
      exit 1
      ;;
  esac
}

# If no arguments, run help
if [ $# -eq 0 ]; then
  help
  exit 0
fi

# Run main function with first argument
main "$1"