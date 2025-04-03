#!/bin/bash

# Test script for API health and database resilience

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting API health and database resilience tests...${NC}"
echo

# Test health endpoint
echo -e "${YELLOW}Testing /api/health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -H "Accept: application/json" "http://localhost:5000/api/health")
echo $HEALTH_RESPONSE | jq

# Check database status from health endpoint
DB_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.database.status')
if [ "$DB_STATUS" == "connected" ]; then
  echo -e "${GREEN}✓ Database is connected${NC}"
else
  echo -e "${RED}✗ Database is not connected: $DB_STATUS${NC}"
fi

echo

# Test database resilience endpoint with 'check' action
echo -e "${YELLOW}Testing database resilience check...${NC}"
CHECK_RESPONSE=$(curl -s -H "Accept: application/json" "http://localhost:5000/api/db-resilience?action=check")
echo $CHECK_RESPONSE | jq

# Extract isConnected value from the JSON response
IS_CONNECTED=$(echo $CHECK_RESPONSE | jq -r '.isConnected')
if [ "$IS_CONNECTED" == "true" ]; then
  echo -e "${GREEN}✓ Database connection check successful${NC}"
else
  echo -e "${RED}✗ Database connection check failed${NC}"
fi

echo

# Test database resilience endpoint with 'retry' action
echo -e "${YELLOW}Testing database retry functionality...${NC}"
RETRY_RESPONSE=$(curl -s -H "Accept: application/json" "http://localhost:5000/api/db-resilience?action=retry")
echo $RETRY_RESPONSE | jq

# Check if retry was successful
RETRY_SUCCESS=$(echo $RETRY_RESPONSE | jq -r '.success')
if [ "$RETRY_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ Database retry operation successful${NC}"
else
  echo -e "${RED}✗ Database retry operation failed${NC}"
fi

echo

# Test database resilience endpoint with 'reconnect' action
echo -e "${YELLOW}Testing database reconnect functionality...${NC}"
RECONNECT_RESPONSE=$(curl -s -H "Accept: application/json" "http://localhost:5000/api/db-resilience?action=reconnect")
echo $RECONNECT_RESPONSE | jq

# Check if reconnect was successful
RECONNECT_SUCCESS=$(echo $RECONNECT_RESPONSE | jq -r '.success')
if [ "$RECONNECT_SUCCESS" == "true" ]; then
  echo -e "${GREEN}✓ Database reconnect operation successful${NC}"
else
  echo -e "${RED}✗ Database reconnect operation failed${NC}"
fi

echo
echo -e "${YELLOW}All tests completed!${NC}"