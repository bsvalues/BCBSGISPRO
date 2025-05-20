# TerraFusion County Data Directory

This directory contains data files for counties integrated with the TerraFusion platform. Each county has its own subdirectory containing organized data files.

## Directory Structure

```
data/
├── <county_name>/
│   ├── parcels/     # Parcel boundary and attribute data
│   ├── sales/       # Property sale history records
│   ├── taxcodes/    # Tax code area definitions
│   ├── plats/       # Plat maps and subdivisions
│   ├── owners/      # Ownership records (restricted access)
│   └── documents/   # Associated legal documents
└── ...
```

## Data Types and Formats

### Parcels
- GeoJSON files containing parcel boundaries and attributes
- CSV files with parcel attributes for non-spatial data
- Shapefile exports (optional)

### Sales
- CSV files containing sales history records
- Each record includes sale date, price, buyer/seller information, and parcel identifier

### Tax Codes
- CSV files defining tax code areas and rates
- GeoJSON files for tax code area boundaries

### Plats
- CSV index of plat records
- PDF scans of recorded plats
- GeoJSON files for plat boundaries

## Data Import Guidelines

1. Place raw data files in the appropriate county directory
2. Use the County Onboarding Workflow to process and validate data
3. Track all data imports using the ETL logging system
4. Document data sources and update frequency in county-specific README files

## Security and Access Control

- Access to this data directory should be restricted based on user role
- All data imports and exports should be logged for audit purposes
- Sensitive information such as owner details should be access-controlled