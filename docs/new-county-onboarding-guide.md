# New County Onboarding Guide

This guide provides step-by-step instructions for onboarding a new county to the TerraFusion GIS platform.

## Prerequisites

- Source data files from the county (CSV, Shapefile, GeoDatabase)
- Access credentials for county systems (if integration is required)
- TerraFusion platform running locally or in a deployment environment

## Step 1: Add County Data Files

1. Create a directory for the new county in the `/data` directory:

```bash
mkdir -p data/new-county-name/parcels
mkdir -p data/new-county-name/plats
mkdir -p data/new-county-name/tax_code
```

2. Copy county data files to the appropriate directories:

```bash
# Copy parcel data
cp /path/to/county/parcels.* data/new-county-name/parcels/

# Copy plat maps
cp /path/to/county/plats.* data/new-county-name/plats/

# Copy tax code data
cp /path/to/county/tax_code.* data/new-county-name/tax_code/
```

## Step 2: Run ETL Scripts

1. Run the appropriate ETL script for the data type:

```bash
# For CSV data
node libs/ETL/importers/csv-importer.js --county=new-county-name --dataType=parcels

# For Shapefile data
node libs/ETL/importers/shapefile-importer.js --county=new-county-name --dataType=parcels

# For GeoDatabase data
node libs/ETL/importers/geodatabase-importer.js --county=new-county-name --dataType=parcels
```

2. Verify the ETL process by checking the logs:

```bash
cat logs/etl/new-county-name-import.log
```

## Step 3: Validate Data

1. Run validation scripts to check for data quality issues:

```bash
node libs/ETL/validators/validate-county-data.js --county=new-county-name
```

2. Review the validation report:

```bash
cat logs/validation/new-county-name-validation-report.json
```

3. Address any validation issues that were found.

## Step 4: Render County Maps

1. Start the application:

```bash
npm run dev
```

2. Navigate to the CartographyModule in your browser.

3. Select the new county from the dropdown menu.

4. Configure layer styling and visualization options.

5. Save the map configuration.

## Step 5: Configure Workflows

1. Navigate to the Admin Dashboard.

2. Set up workflow templates for the new county.

3. Configure user roles and permissions.

4. Set up any county-specific settings.

## Step 6: Test End-to-End

1. Perform a test valuation on a sample property.

2. Generate a sample report.

3. Verify that all components are working correctly.

## Troubleshooting

- If data import fails, check the format of the source files.
- If map rendering fails, verify that the spatial reference systems match.
- If validation reports errors, review the data quality issues and fix them at the source if possible.

## Next Steps

- Set up automated data synchronization (if applicable)
- Train county staff on the platform
- Create county-specific documentation