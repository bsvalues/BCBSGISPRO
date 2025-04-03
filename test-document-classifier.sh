#!/bin/bash

# Test script for document classification

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing document classification API...${NC}"
echo

# Test plat map classification
echo -e "${YELLOW}Testing classification of a plat map document...${NC}"
PLAT_MAP_TEXT="SURVEYOR'S CERTIFICATE AND DESCRIPTION
BENTON COUNTY SUBDIVISION PLAT 2025-001
LOCATED IN THE NW 1/4 OF SECTION 12, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M.
CITY OF KENNEWICK, BENTON COUNTY, WASHINGTON

I, John Smith, a Professional Land Surveyor, licensed by the State of Washington,
certify that this plat accurately represents a survey completed by me in January 2025.
This plat establishes 12 residential lots numbered 1 through 12 as indicated hereon.

LEGAL DESCRIPTION:
A PORTION OF THE NORTHWEST QUARTER OF SECTION 12, TOWNSHIP 8 NORTH, RANGE 29 EAST,
WILLAMETTE MERIDIAN, BENTON COUNTY, WASHINGTON, MORE PARTICULARLY DESCRIBED AS FOLLOWS:
COMMENCING AT THE NORTHWEST CORNER OF SAID SECTION 12; THENCE SOUTH 0°15'00\" EAST
ALONG THE WEST LINE OF SAID NORTHWEST QUARTER, A DISTANCE OF 40.00 FEET
TO THE TRUE POINT OF BEGINNING;
[...additional survey measurements...]
CONTAINING 5.23 ACRES, MORE OR LESS."

PLAT_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/documents/classify" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$PLAT_MAP_TEXT\"}")

echo $PLAT_RESPONSE | jq

# Check document type
DOC_TYPE=$(echo $PLAT_RESPONSE | jq -r '.documentType')
if [ "$DOC_TYPE" == "plat_map" ]; then
  echo -e "${GREEN}✓ Correctly classified as plat_map${NC}"
else
  echo -e "${RED}✗ Failed to classify as plat_map, got: $DOC_TYPE${NC}"
fi

echo

# Test deed classification
echo -e "${YELLOW}Testing classification of a deed document...${NC}"
DEED_TEXT="WARRANTY DEED

THE GRANTOR, Jane Johnson, a single person, for and in consideration of
Ten and No/100 Dollars ($10.00) and other valuable consideration in hand paid,
conveys and warrants to THE GRANTEE, Robert Brown and Susan Brown, husband and wife,
the following described real estate situated in Benton County, State of Washington:

LEGAL DESCRIPTION:
LOT 5, BLOCK 3, RIVERSIDE ADDITION TO THE CITY OF RICHLAND,
ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 9 OF PLATS,
PAGE 78, RECORDS OF BENTON COUNTY, WASHINGTON.

PARCEL NUMBER: 1-12345-678

Subject to: Covenants, conditions, restrictions and easements, if any, affecting title,
which may appear in public record.

DATED this 15th day of March, 2025.

___________________________
Jane Johnson, Grantor

STATE OF WASHINGTON )
                    ) ss.
COUNTY OF BENTON    )"

DEED_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/documents/classify" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$DEED_TEXT\"}")

echo $DEED_RESPONSE | jq

# Check document type
DOC_TYPE=$(echo $DEED_RESPONSE | jq -r '.documentType')
if [ "$DOC_TYPE" == "deed" ]; then
  echo -e "${GREEN}✓ Correctly classified as deed${NC}"
else
  echo -e "${RED}✗ Failed to classify as deed, got: $DOC_TYPE${NC}"
fi

echo

# Test survey classification
echo -e "${YELLOW}Testing classification of a survey document...${NC}"
SURVEY_TEXT="RECORD OF SURVEY
LOCATED IN THE NE 1/4 OF SECTION 24, TOWNSHIP 9 NORTH, RANGE 28 EAST, W.M.
BENTON COUNTY, WASHINGTON

SURVEYOR'S CERTIFICATE:
THIS MAP CORRECTLY REPRESENTS A SURVEY MADE BY ME OR UNDER MY DIRECTION 
IN CONFORMANCE WITH THE REQUIREMENTS OF THE SURVEY RECORDING ACT 
AT THE REQUEST OF MICHAEL WILSON IN FEBRUARY 2025.

FIELD BOOK REFERENCE: 456-78
SURVEY DATE: FEBRUARY 5-8, 2025

LEGEND:
• FOUND MONUMENT AS NOTED
◆ SET 5/8\" REBAR WITH CAP \"PLS 12345\"
○ CALCULATED POSITION, NOTHING SET

SCALE: 1\" = 50'

BEARINGS AND DISTANCES:
FROM POINT A TO POINT B: N88°45'22\"E, 325.67 FEET
FROM POINT B TO POINT C: S01°15'38\"E, 412.33 FEET
FROM POINT C TO POINT D: S87°22'41\"W, 329.55 FEET
FROM POINT D TO POINT A: N00°52'17\"W, 399.88 FEET"

SURVEY_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/documents/classify" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$SURVEY_TEXT\"}")

echo $SURVEY_RESPONSE | jq

# Check document type
DOC_TYPE=$(echo $SURVEY_RESPONSE | jq -r '.documentType')
if [ "$DOC_TYPE" == "survey" ]; then
  echo -e "${GREEN}✓ Correctly classified as survey${NC}"
else
  echo -e "${RED}✗ Failed to classify as survey, got: $DOC_TYPE${NC}"
fi

echo

# Test boundary line adjustment classification
echo -e "${YELLOW}Testing classification of a boundary line adjustment document...${NC}"
BLA_TEXT="BOUNDARY LINE ADJUSTMENT
FILE NO. BLA-2025-042
BENTON COUNTY COMMUNITY DEVELOPMENT DEPARTMENT

LEGAL DESCRIPTION OF ORIGINAL PARCELS:

PARCEL A (PARCEL NO. 1-23456-789):
THE EAST 125 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION,
AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY,
WASHINGTON.

PARCEL B (PARCEL NO. 1-23456-790):
THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8, BLOCK 3, SUNNYDALE ADDITION,
AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY,
WASHINGTON.

LEGAL DESCRIPTION OF ADJUSTMENT AREA:
THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION.

LEGAL DESCRIPTION OF PARCELS AFTER BOUNDARY LINE ADJUSTMENT:

PARCEL A-ADJUSTED (PARCEL NO. 1-23456-789):
THE EAST 100 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION,
AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY,
WASHINGTON.

PARCEL B-ADJUSTED (PARCEL NO. 1-23456-790):
THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8 AND THE EAST 25 FEET OF THE 
NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED 
IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON.

OWNERS CERTIFICATION:
THE UNDERSIGNED HEREBY CERTIFY THAT THEY ARE THE OWNERS OF THE PROPERTY 
DESCRIBED HEREIN AND HAVE APPLIED FOR A BOUNDARY LINE ADJUSTMENT.

APPROVED BY BENTON COUNTY COMMUNITY DEVELOPMENT DEPARTMENT:
DATE: MARCH 10, 2025"

BLA_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/documents/classify" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$BLA_TEXT\"}")

echo $BLA_RESPONSE | jq

# Check document type
DOC_TYPE=$(echo $BLA_RESPONSE | jq -r '.documentType')
if [ "$DOC_TYPE" == "boundary_line_adjustment" ]; then
  echo -e "${GREEN}✓ Correctly classified as boundary_line_adjustment${NC}"
else
  echo -e "${RED}✗ Failed to classify as boundary_line_adjustment, got: $DOC_TYPE${NC}"
fi

echo
echo -e "${YELLOW}All document classification tests completed!${NC}"