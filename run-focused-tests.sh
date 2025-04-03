#!/bin/bash

# This script runs focused tests on specific parts of the application
# Usage: ./run-focused-tests.sh <component>
# Example: ./run-focused-tests.sh map-layers

set -e

function run_tests() {
  component=$1
  
  case $component in
    "map-layers")
      echo "🧪 Running map layer tests..."
      npx jest __tests__/map-layer-opacity.test.ts
      npx jest __tests__/client/enhanced-layer-control.test.tsx
      npx jest __tests__/client/LayerFilter.test.tsx
      ;;
      
    "documents")
      echo "🧪 Running document tests..."
      npx jest __tests__/document-classification.test.ts
      npx jest __tests__/client/DocumentClassificationSystem.test.tsx
      npx jest __tests__/client/DocumentParcelLink.test.tsx
      npx jest __tests__/client/DocumentVersionControl.test.tsx
      ;;
      
    "drawing")
      echo "🧪 Running drawing tools tests..."
      npx jest __tests__/drawing-annotation.test.ts
      npx jest __tests__/drawing-history.test.ts
      npx jest __tests__/snap-to-feature.test.ts
      npx jest __tests__/measurement-system.test.ts
      ;;
      
    "workflows")
      echo "🧪 Running workflow tests..."
      npx jest __tests__/client/workflow.test.tsx
      npx jest __tests__/client/workflow-dashboard.test.tsx
      npx jest __tests__/client/WorkflowMapIntegration.test.ts
      ;;
      
    "api")
      echo "🧪 Running API tests..."
      npx jest __tests__/server/routes.test.ts
      npx jest __tests__/server/api.test.js
      ;;
      
    "db")
      echo "🧪 Running database tests..."
      npx jest __tests__/server/db.schema.test.ts
      npx jest __tests__/server/storage.test.ts
      ./debug-test.sh
      ;;
      
    "core")
      echo "🧪 Running core component tests..."
      npx jest __tests__/client/core-component.test.tsx
      ;;
      
    "all")
      echo "🧪 Running all tests..."
      npx jest
      ;;
      
    *)
      echo "❌ Unknown component: $component"
      echo "Valid components are: map-layers, documents, drawing, workflows, api, db, core, all"
      exit 1
      ;;
  esac
}

if [ $# -eq 0 ]; then
  echo "Usage: $0 <component>"
  echo "Valid components are: map-layers, documents, drawing, workflows, api, db, core, all"
  exit 1
else
  run_tests $1
fi