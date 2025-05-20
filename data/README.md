# Data Directory

This directory contains county data files for the TerraFusion platform, including sample and demo data.

## Structure

Data is organized by county, with each county having its own directory:

```
/data/
  /benton/     # Benton County data
  /example/    # Example County data (for testing)
  /templates/  # Templates for new county data
```

## Supported Formats

- CSV (.csv): For tabular data
- Shapefile (.shp, .shx, .dbf, etc.): For vector spatial data
- GeoDatabase (.gdb): For ESRI GeoDatabase format
- GeoJSON (.geojson): For open standard spatial data

## Adding New County Data

1. Create a new directory with the county name
2. Add data files to the directory
3. Use the ETL module to import and normalize the data
4. Verify the import using the CartographyModule

## Sample Data

Sample data is provided for demonstration and testing purposes. Do not use sample data for production purposes.