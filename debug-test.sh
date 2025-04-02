#!/bin/bash

# This script runs a specific test file with more logging
echo "Running test: $1"
npx jest $1 --verbose --detectOpenHandles