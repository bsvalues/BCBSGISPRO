#!/bin/bash

# Test script for boundary line adjustment document classification

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing improved boundary line adjustment classification...${NC}"
echo

# Create a temporary file with the JSON payload for BLA
cat > temp_bla_test.json << EOF
{
  "text": "BOUNDARY LINE ADJUSTMENT FILE NO. BLA-2025-042 BENTON COUNTY COMMUNITY DEVELOPMENT DEPARTMENT. LEGAL DESCRIPTION OF ORIGINAL PARCELS: PARCEL A (PARCEL NO. 1-23456-789): THE EAST 125 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON. PARCEL B (PARCEL NO. 1-23456-790): THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON. LEGAL DESCRIPTION OF ADJUSTMENT AREA: THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION. LEGAL DESCRIPTION OF PARCELS AFTER BOUNDARY LINE ADJUSTMENT: PARCEL A-ADJUSTED (PARCEL NO. 1-23456-789): THE EAST 100 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION. PARCEL B-ADJUSTED (PARCEL NO. 1-23456-790): THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8 AND THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION."
}
EOF

BLA_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/documents/classify" \
  -H "Content-Type: application/json" \
  -d @temp_bla_test.json)

echo "$BLA_RESPONSE" | jq

# Check document type
DOC_TYPE=$(echo "$BLA_RESPONSE" | jq -r '.documentType')
if [ "$DOC_TYPE" == "boundary_line_adjustment" ]; then
  echo -e "${GREEN}✓ Correctly classified as boundary_line_adjustment${NC}"
else
  echo -e "${RED}✗ Failed to classify as boundary_line_adjustment, got: $DOC_TYPE${NC}"
fi

# Clean up temp file
rm temp_bla_test.json

echo -e "${YELLOW}Test completed!${NC}"