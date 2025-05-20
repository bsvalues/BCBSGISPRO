# ETL (Extract, Transform, Load)

This module contains all data import, cleaning, and normalization scripts for the TerraFusion platform.

## Features

- Data import from various sources (CSV, Shapefile, GeoDatabase)
- Data cleaning and validation
- Field mapping and normalization
- Data quality assessment
- Import logging and auditing

## Usage

The ETL module is used to ingest data from county sources, normalize it to the TerraFusion data model, and make it available for use in the application.

## Key Components

- DataImporter: Imports data from various file formats
- FieldMapper: Maps county-specific field names to standard schema
- DataValidator: Validates data quality and compliance
- ImportLogger: Logs import activity for auditing

## Integration

This module provides data to both the CartographyModule for mapping and the GAMAValuation module for analysis.