#!/bin/bash

# Simple script to run core tests one by one with detailed output
# This helps identify specific issues without overwhelming output

set -e

echo "🧪 Running Document Classification Tests..."
if npx jest __tests__/document-classification.test.ts --verbose --passWithNoTests; then
  echo "✅ Document Classification Tests passed!"
else
  echo "❌ Document Classification Tests failed!"
  exit 1
fi

echo "🧪 Running Drawing Annotation Tests..."
if npx jest __tests__/drawing-annotation.test.ts --verbose --passWithNoTests; then
  echo "✅ Drawing Annotation Tests passed!"
else
  echo "❌ Drawing Annotation Tests failed!"
  exit 1
fi

echo "✅ All core tests completed."