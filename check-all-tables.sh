#!/bin/bash

# This script checks for all tables in the database schema
set -e

# Define the tables to check based on schema.ts
tables=(
  "users"
  "workflows"
  "workflow_states"
  "workflow_events"
  "checklist_items"
  "documents"
  "document_parcel_links"
  "document_versions"
  "parcels"
  "map_layers"
  "report_templates"
  "reports"
  "report_schedules"
  "report_exports"
  "sm00_reports"
)

# Define the enums to check based on schema.ts
enums=(
  "workflow_type"
  "workflow_status"
  "workflow_priority" 
  "workflow_event_type"
  "document_type"
  "document_content_type"
  "map_layer_type"
  "map_layer_source"
  "report_status"
  "report_schedule_frequency"
  "report_format"
)

echo "=== Checking database tables ==="
for table in "${tables[@]}"; do
  table_exists=$(psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table')" -t | tr -d ' ')
  
  if [ "$table_exists" = "t" ]; then
    echo "✅ $table table exists"
  else
    echo "❌ $table table does NOT exist"
  fi
done

echo -e "\n=== Checking database enums ==="
for enum in "${enums[@]}"; do
  enum_exists=$(psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM pg_type WHERE typname = '$enum')" -t | tr -d ' ')
  
  if [ "$enum_exists" = "t" ]; then
    echo "✅ $enum enum exists"
  else
    echo "❌ $enum enum does NOT exist"
  fi
done