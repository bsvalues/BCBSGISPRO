#!/bin/bash

# Script to test BLA pattern matching

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing BLA pattern matching...${NC}"

# Create the test file
cat > check_bla_patterns.js << EOF
// Test script to check BLA pattern matching
const text = \`BOUNDARY LINE ADJUSTMENT FILE NO. BLA-2025-042 BENTON COUNTY COMMUNITY DEVELOPMENT DEPARTMENT. LEGAL DESCRIPTION OF ORIGINAL PARCELS: PARCEL A (PARCEL NO. 1-23456-789): THE EAST 125 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON. PARCEL B (PARCEL NO. 1-23456-790): THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON. LEGAL DESCRIPTION OF ADJUSTMENT AREA: THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION. LEGAL DESCRIPTION OF PARCELS AFTER BOUNDARY LINE ADJUSTMENT: PARCEL A-ADJUSTED (PARCEL NO. 1-23456-789): THE EAST 100 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION. PARCEL B-ADJUSTED (PARCEL NO. 1-23456-790): THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8 AND THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION.\`;

const normalizedText = text.toLowerCase();

// Check for specific BLA-related patterns that strongly indicate BLA documents
const specificBLAPatterns = [
  /\bboundary\s+line\s+adjustment\b/i,
  /\bbla[-\s][0-9]+/i,
  /\bparcel.+adjusted\b/i,
  /\badjustment\s+area\b/i,
  /\bparcels\s+after\s+boundary\s+line\s+adjustment\b/i,
  /\badjusted\s+parcel\b/i
];

// Count and display matches
console.log("BLA Pattern Matches:");
const matches = specificBLAPatterns.filter((pattern, index) => {
  const isMatch = pattern.test(normalizedText);
  console.log(\`Pattern \${index + 1}: \${pattern}\`);
  console.log(\`  Match: \${isMatch ? "✓" : "✗"}\`);
  if (isMatch) {
    const match = normalizedText.match(pattern);
    console.log(\`  Found: "\${match[0]}"\`);
  }
  return isMatch;
});

console.log(\`\nTotal matches found: \${matches.length}\`);
EOF

# Run the test
echo -e "\n${YELLOW}Running pattern match test...${NC}\n"
node check_bla_patterns.js

# Clean up
rm check_bla_patterns.js

echo -e "\n${YELLOW}Pattern matching test completed!${NC}"