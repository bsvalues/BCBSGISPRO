#!/bin/bash

# This script specifically checks for workflow creation bugs by examining requests

echo "Testing workflow creation issue..."

# Test server-side API functionality
echo "1. Running server routes test..."
npx jest __tests__/server/routes.test.ts

# Examine the client-side code for repeated API calls
echo "2. Checking client code for excessive API calls..."
echo "-------------------------------------------------"
echo "Suspected issue: Repeated workflow creation calls"
echo "Looking at workflow-page.tsx and home-page.tsx"

npx jest __tests__/client/workflow.test.tsx