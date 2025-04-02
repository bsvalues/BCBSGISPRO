#!/bin/bash

# This script tests database connectivity and schema existence
set -e

echo "Testing database connectivity..."
# Execute a SQL query to verify the database connection
result=$(psql $DATABASE_URL -c "SELECT 1 as test" -t | tr -d ' ')

if [ "$result" -eq 1 ]; then
  echo "✅ Database connection successful!"
else
  echo "❌ Database connection failed!"
  exit 1
fi

echo "Checking workflow_events table..."
# Check if the workflow_events table exists
table_exists=$(psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflow_events')" -t | tr -d ' ')

if [ "$table_exists" = "t" ]; then
  echo "✅ workflow_events table exists!"
else
  echo "❌ workflow_events table does not exist!"
  exit 1
fi

echo "Checking workflow_event_type enum..."
# Check if the workflow_event_type enum exists
enum_exists=$(psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM pg_type WHERE typname = 'workflow_event_type')" -t | tr -d ' ')

if [ "$enum_exists" = "t" ]; then
  echo "✅ workflow_event_type enum exists!"
else
  echo "❌ workflow_event_type enum does not exist!"
  exit 1
fi

# Check if users table exists
echo "Checking users table..."
table_exists=$(psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')" -t | tr -d ' ')

if [ "$table_exists" = "t" ]; then
  echo "✅ users table exists!"
else
  echo "❌ users table does not exist!"
  exit 1
fi

# Check if workflows table exists
echo "Checking workflows table..."
table_exists=$(psql $DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workflows')" -t | tr -d ' ')

if [ "$table_exists" = "t" ]; then
  echo "✅ workflows table exists!"
else
  echo "❌ workflows table does not exist!"
  exit 1
fi

echo "All database schema tests passed! ✅"