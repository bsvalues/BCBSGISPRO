#!/bin/bash

# Script to verify essential API health and functionality
# Returns non-zero exit code if any checks fail

echo "🏥 Checking API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
DB_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"database":{"status":"connected"}')

if [ -z "$DB_STATUS" ]; then
  echo "❌ Database connection failed! API health check returned:"
  echo $HEALTH_RESPONSE
  exit 1
else
  echo "✅ API health check passed. Database is connected."
fi

echo "🧪 Testing document classification API..."
CLASSIFICATION_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"PLAT MAP OF BENTON COUNTY SUBDIVISION LOT 7 BLOCK 3 RECORDED DOCUMENT"}' \
  http://localhost:5000/api/documents/classify)

DOCUMENT_TYPE=$(echo $CLASSIFICATION_RESPONSE | grep -o '"documentType":"plat_map"')
if [ -z "$DOCUMENT_TYPE" ]; then
  echo "❌ Document classification API test failed! Response:"
  echo $CLASSIFICATION_RESPONSE
  exit 1
else
  echo "✅ Document classification API test passed."
fi

echo "🧪 Testing document-parcel link API..."
PARCEL_DOCUMENTS_RESPONSE=$(curl -s http://localhost:5000/api/parcels/6/documents)
if [[ $PARCEL_DOCUMENTS_RESPONSE == \[*\"id\"*\"workflowId\"*\"name\"*\"type\"* ]]; then
  echo "✅ Document-parcel link API test passed."
else
  echo "❌ Document-parcel link API test failed! Response:"
  echo $PARCEL_DOCUMENTS_RESPONSE
  exit 1
fi

echo "✅ All API health and functionality checks passed!"
exit 0