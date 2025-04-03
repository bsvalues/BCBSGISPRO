#!/bin/bash

# Script to check the status of all expected database tables
# and report any missing or incomplete tables

# Set the database URL from environment variable
DB_URL=${DATABASE_URL}

if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  exit 1
fi

# Expected tables based on the schema
EXPECTED_TABLES=(
  "users"
  "sessions"
  "workflows"
  "workflow_events"
  "workflow_states"
  "checklist_items"
  "documents"
  "document_versions"
  "document_parcel_links"
  "parcels"
  "map_layers"
)

# Function to check if a table exists
check_table() {
  local table=$1
  
  # Query to check if table exists
  exists_query="SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '$table'
  );"
  
  # Run the query and get result
  exists=$(psql "$DB_URL" -t -c "$exists_query" | tr -d ' ')
  
  if [ "$exists" = "t" ]; then
    # Count the rows in the table
    count_query="SELECT count(*) FROM $table;"
    count=$(psql "$DB_URL" -t -c "$count_query" | tr -d ' ')
    
    # Get column information
    columns_query="SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '$table';"
    columns=$(psql "$DB_URL" -t -c "$columns_query")
    
    echo -e "\033[32m✓ Table '$table' exists with $count rows\033[0m"
    echo "  Columns:"
    echo "$columns" | while read line; do
      echo "    - $line"
    done
    echo ""
  else
    echo -e "\033[31m❌ Table '$table' does not exist\033[0m"
  fi
}

echo "🔍 Checking database tables..."
echo "Database URL: ${DB_URL//:*@/:***@}"
echo "================================================="

for table in "${EXPECTED_TABLES[@]}"; do
  check_table "$table"
done

# Check for incomplete/broken tables
echo "================================================="
echo "🔍 Checking for tables with missing references..."

# Check document_parcel_links for missing documents or parcels
if psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_parcel_links');" | grep -q t; then
  missing_refs=$(psql "$DB_URL" -t -c "
    SELECT dpl.id, dpl.document_id, dpl.parcel_id 
    FROM document_parcel_links dpl 
    LEFT JOIN documents d ON dpl.document_id = d.id 
    LEFT JOIN parcels p ON dpl.parcel_id = p.id 
    WHERE d.id IS NULL OR p.id IS NULL;
  ")
  
  if [ -z "$missing_refs" ]; then
    echo -e "\033[32m✓ All document_parcel_links have valid references\033[0m"
  else
    echo -e "\033[31m❌ Found document_parcel_links with missing references:\033[0m"
    echo "$missing_refs"
  fi
fi

# Check document_versions for missing documents
if psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_versions');" | grep -q t; then
  missing_refs=$(psql "$DB_URL" -t -c "
    SELECT dv.id, dv.document_id 
    FROM document_versions dv 
    LEFT JOIN documents d ON dv.document_id = d.id 
    WHERE d.id IS NULL;
  ")
  
  if [ -z "$missing_refs" ]; then
    echo -e "\033[32m✓ All document_versions have valid document references\033[0m"
  else
    echo -e "\033[31m❌ Found document_versions with missing document references:\033[0m"
    echo "$missing_refs"
  fi
fi

# Check for malformed data in map_layers
if psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'map_layers');" | grep -q t; then
  malformed_data=$(psql "$DB_URL" -t -c "
    SELECT id, name, opacity 
    FROM map_layers 
    WHERE opacity IS NOT NULL AND (opacity < 0 OR opacity > 100);
  ")
  
  if [ -z "$malformed_data" ]; then
    echo -e "\033[32m✓ All map_layers have valid opacity values (0-100)\033[0m"
  else
    echo -e "\033[31m❌ Found map_layers with invalid opacity values (should be 0-100):\033[0m"
    echo "$malformed_data"
  fi
fi

echo "================================================="
echo "✅ Database check complete"