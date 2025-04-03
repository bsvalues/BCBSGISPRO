#!/bin/bash

# Script to run tests for the BentonGeoPro application
# Usage: ./run-tests.sh [options]

set -e

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
RUN_CLIENT_TESTS=true
RUN_SERVER_TESTS=true
RUN_INTEGRATION_TESTS=true
WATCH_MODE=false
VERBOSE=false
COVERAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --client)
      RUN_CLIENT_TESTS=true
      RUN_SERVER_TESTS=false
      RUN_INTEGRATION_TESTS=false
      shift
      ;;
    --server)
      RUN_CLIENT_TESTS=false
      RUN_SERVER_TESTS=true
      RUN_INTEGRATION_TESTS=false
      shift
      ;;
    --integration)
      RUN_CLIENT_TESTS=false
      RUN_SERVER_TESTS=false
      RUN_INTEGRATION_TESTS=true
      shift
      ;;
    --watch)
      WATCH_MODE=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --client      Run only client-side tests"
      echo "  --server      Run only server-side tests"
      echo "  --integration Run only integration tests"
      echo "  --watch       Run tests in watch mode"
      echo "  --verbose     Run tests with verbose output"
      echo "  --coverage    Generate test coverage report"
      echo "  --help        Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to run tests with the specified options
run_tests() {
  local test_path=$1
  local test_name=$2

  echo -e "${BLUE}Running $test_name tests...${NC}"

  # Build the command
  cmd="npx jest $test_path"
  
  if [ "$WATCH_MODE" = true ]; then
    cmd="$cmd --watch"
  fi
  
  if [ "$VERBOSE" = true ]; then
    cmd="$cmd --verbose"
  fi
  
  if [ "$COVERAGE" = true ]; then
    cmd="$cmd --coverage"
  fi
  
  # Run the command
  if eval "$cmd"; then
    echo -e "${GREEN}✓ $test_name tests passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_name tests failed${NC}"
    return 1
  fi
}

# Track if any test suite fails
FAILURES=0

# Run client tests if enabled
if [ "$RUN_CLIENT_TESTS" = true ]; then
  if ! run_tests "__tests__/client" "Client"; then
    FAILURES=$((FAILURES + 1))
  fi
fi

# Run server tests if enabled
if [ "$RUN_SERVER_TESTS" = true ]; then
  if ! run_tests "__tests__/server" "Server"; then
    FAILURES=$((FAILURES + 1))
  fi
fi

# Run integration tests if enabled
if [ "$RUN_INTEGRATION_TESTS" = true ]; then
  if ! run_tests "__tests__/!(client|server)/**" "Integration"; then
    FAILURES=$((FAILURES + 1))
  fi
fi

# If all test types are disabled, run all tests
if [ "$RUN_CLIENT_TESTS" = false ] && [ "$RUN_SERVER_TESTS" = false ] && [ "$RUN_INTEGRATION_TESTS" = false ]; then
  if ! run_tests "__tests__" "All"; then
    FAILURES=$((FAILURES + 1))
  fi
fi

# Print summary
echo -e "${BLUE}===============================${NC}"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Some test suites failed!${NC}"
  exit 1
fi