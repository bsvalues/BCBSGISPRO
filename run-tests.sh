#!/bin/bash

# Run all tests if no argument is provided
if [ $# -eq 0 ]; then
  echo "Running all tests..."
  npx jest
else
  # Run specific test files passed as arguments
  echo "Running tests: $@"
  npx jest $@
fi