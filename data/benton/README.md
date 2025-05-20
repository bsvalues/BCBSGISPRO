# Benton County Data

This directory contains the data files for Benton County integrated with the TerraFusion platform.

## Data Sources

- **Parcels**: Benton County Assessor's Office GIS Department (Updated quarterly)
- **Sales**: County Recorder's Office (Updated monthly)
- **Tax Codes**: County Assessor's Office (Updated annually)
- **Plats**: County Surveyor's Office (Updated as recorded)

## Data Structure

### Parcels
- `parcels.geojson`: Parcel boundaries with attributes
- `parcels_attributes.csv`: Extended parcel attributes
- `parcels_metadata.json`: Data dictionary and metadata

### Sales
- `sales_history.csv`: Historical sales records
- `sales_current_year.csv`: Current year sales records
- `sales_metadata.json`: Data dictionary and metadata

### Tax Codes
- `taxcode_areas.geojson`: Tax code area boundaries
- `taxcode_rates.csv`: Tax rates by jurisdiction and tax code
- `taxcode_metadata.json`: Data dictionary and metadata

### Plats
- `plats_index.csv`: Index of all recorded plats
- `plats_boundaries.geojson`: Plat boundaries
- `plat_scans/*.pdf`: Scanned plat documents

## Import History

Last Import Date: 2025-04-15
- Parcels: 65,247 records
- Sales: 12,589 records
- Tax Codes: 93 records
- Plats: 4,127 records

## Notes

- The Benton County coordinate system is EPSG:2927 (NAD83 Washington South)
- Parcels are identified by the "PIN" field (Parcel Identification Number)
- Historical data prior to 2010 may have data quality issues that have been documented
- Legal descriptions are stored in the `legal_desc` field of the parcels_attributes.csv file