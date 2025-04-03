#!/bin/bash

# Script to test document-parcel relationship functionality
# This script runs tests specifically related to document-parcel relationship features

set -e

echo "🧪 Running Document-Parcel Relationship Tests..."

# Run the client-side relationship tests
echo "🔍 Running client-side document-parcel relationship tests..."
npx jest __tests__/client/DocumentParcelRelationship.test.tsx

# Run the server-side service tests
echo "🔍 Running document-parcel service tests..."
npx jest __tests__/server/document-parcel-service.test.ts

# Run the server API route tests
echo "🔍 Running document-parcel API route tests..."
npx jest __tests__/server/document-parcel-routes.test.ts

echo "✅ Document-Parcel Relationship Tests completed!"