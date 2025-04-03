# BentonGeoPro Test Plan

This document outlines the test strategy for the BentonGeoPro application.

## Testing Approach

The BentonGeoPro application uses a combination of testing methodologies:

1. **Unit Tests**: Testing individual functions and components in isolation
2. **Integration Tests**: Testing how components interact with each other
3. **API Tests**: Testing REST API endpoints
4. **Database Tests**: Testing database operations and schema integrity

## Test Environments

- **Development**: Local developer machines, using in-memory storage or test database
- **CI/CD**: Automated tests run in the CI pipeline using test databases
- **Staging**: Tests against a full staging environment with realistic data
- **Production**: Smoke tests to verify production deployment

## Test Framework and Tools

- **Jest**: Primary test runner and assertion library
- **React Testing Library**: Testing React components
- **Supertest**: Testing HTTP endpoints
- **node-fetch**: Making HTTP requests in tests

## Test Categories

### 1. Core Functionality Tests

These tests verify the core functionality of the application:

- Authentication and authorization
- Workflow management
- Map visualization and layer control
- Document management
- Parcel data handling

### 2. Component Tests

These tests focus on React components and their behavior:

- Map viewer components
- Layer control
- Document classification UI
- Workflow status displays
- Form validations

### 3. API Tests

These tests verify API endpoints:

- Map layer endpoints
- Document endpoints
- Authentication endpoints
- Workflow endpoints
- Parcel data endpoints

### 4. Database Tests

These tests verify database operations:

- Schema validation
- CRUD operations
- Data integrity
- Foreign key relationships

## Testing Scripts

We've created several scripts to facilitate testing:

- `./run-tests.sh`: Run all tests
- `./run-focused-tests.sh <component>`: Run tests for a specific component
- `./debug-test.sh <option>`: Debug specific test issues
- `./check-all-tables.sh`: Verify database schema

## Key Test Areas

### 1. Map Layer Opacity

Tests in `__tests__/map-layer-opacity.test.ts` verify:
- The API handles null opacity values correctly by using a default value
- The opacity normalization from DB (0-100) to UI (0-1) works properly
- The API properly updates opacity values

### 2. Document Classification

Tests in `__tests__/document-classification.test.ts` verify:
- The document classification endpoint works properly
- Different document types are correctly identified
- Classification confidence scores are correctly calculated

### 3. Drawing and Annotation

Tests in `__tests__/drawing-annotation.test.ts` verify:
- Annotations can be added, retrieved, and cleared
- Annotations maintain proper structure and IDs
- Annotations with the same position but different text are treated separately

### 4. Measurement System

Tests in `__tests__/measurement-system.test.ts` verify:
- Distance calculations between points
- Area calculations for polygons
- Unit conversions (metric to imperial and vice versa)
- Proper formatting of measurements with units

### 5. Map Viewer

Tests in `__tests__/client/map-viewer-page.test.tsx` verify:
- The map viewer loads correctly with data from the API
- Error handling works correctly
- Layer styles are formatted correctly

### 6. Layer Control

Tests in `__tests__/client/enhanced-layer-control.test.tsx` verify:
- Layer visibility can be toggled
- Layer opacity can be adjusted
- Layers are properly ordered
- Error handling works correctly

## Test Data Management

Test data is managed through:

1. **Mock Data**: For component and unit tests
2. **Test Database Seeds**: For integration and API tests
3. **DB Reset Scripts**: To ensure test isolation

## Test Result Documentation

Test results are documented in:

- CI/CD pipeline logs
- Test coverage reports
- Issue tracking for test failures

## Test Coverage Goals

- **Unit Tests**: 80% coverage
- **Integration Tests**: 70% coverage
- **API Tests**: 90% coverage
- **Component Tests**: 75% coverage

## Troubleshooting Tests

If tests are failing, follow these steps:

1. Check the error message for specific failures
2. Run the specific failing test in isolation using `./run-focused-tests.sh`
3. For database-related issues, run `./debug-test.sh` with the appropriate option
4. For schema issues, run `./check-all-tables.sh` to verify the database schema
5. For missing tables, run SQL scripts in `fix-missing-tables.sql`

## Regular Test Maintenance

Tests should be maintained:

1. When adding new features
2. When fixing bugs
3. During periodic code quality reviews
4. When refactoring existing code