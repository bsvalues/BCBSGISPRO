# County Onboarding Guide for TerraFusion Platform

This guide provides step-by-step instructions for onboarding a new county to the TerraFusion platform, including data preparation, import procedures, and configuration steps.

## Overview

The county onboarding process consists of the following major phases:
1. **Preparation**: Gathering and preparing county data
2. **Import**: Loading data into the TerraFusion platform
3. **Validation**: Verifying data accuracy and completeness
4. **Configuration**: Setting up county-specific parameters
5. **Activation**: Making the county live on the platform

## 1. Preparation Phase

### 1.1 Required Data Files

Gather the following data files from the county:

| Data Type | Required Format | Description |
|-----------|----------------|-------------|
| Parcels | GeoJSON or Shapefile | Parcel boundaries with attributes |
| Parcels Attributes | CSV | Extended parcel data (if not in GeoJSON) |
| Tax Codes | CSV or GeoJSON | Tax code area definitions |
| Sales History | CSV | Property sale records |
| Plats | CSV/PDF | Plat map records and images |

### 1.2 Data Specifications

#### Parcels GeoJSON
- Must contain valid polygon geometries
- Each feature must include a unique identifier (e.g., PIN, APN)
- Coordinate reference system should be documented (preferably EPSG:4326)

#### Parcels Attributes CSV
- Must include the same unique identifier as the GeoJSON
- Should contain all assessment data (land value, improvement value, etc.)
- Date fields should be formatted as YYYY-MM-DD

#### Tax Codes CSV
- Must include tax code ID and rate information
- Should include jurisdiction information

#### Sales History CSV
- Must include parcel identifier matching the parcel data
- Should include sale date, price, and deed type
- Date fields should be formatted as YYYY-MM-DD

#### Plats CSV
- Should index all plats with a unique identifier
- Should reference associated parcel IDs

### 1.3 Data Preparation Checklist

Before proceeding to import, verify:

- [ ] All required fields are present in each dataset
- [ ] Data formats are consistent with platform requirements
- [ ] Unique identifiers are consistent across all datasets
- [ ] Coordinate systems are properly defined
- [ ] All dates are in the correct format
- [ ] No special characters in fields that may cause import issues

## 2. Import Phase

### 2.1 Access the Onboarding Workflow

1. Log in to the TerraFusion admin dashboard
2. Navigate to "County Management" → "Onboard New County"
3. The onboarding workflow will guide you through the following steps

### 2.2 County Information

Enter basic county information:
- County name
- State
- FIPS code
- Contact information for county officials
- County website URL

### 2.3 Data Upload

For each data type:
1. Select the appropriate file for upload
2. Specify any necessary format options (delimiter, encoding, etc.)
3. Upload the file
4. Wait for initial validation to complete
5. Address any critical errors before proceeding

### 2.4 Field Mapping

The system will present fields from the uploaded files and ask you to map them to platform fields:

1. Review detected fields
2. Map each required field to the corresponding field in your data
3. Set data types for each field (string, number, date, etc.)
4. Configure any special formatting requirements

## 3. Validation Phase

### 3.1 Automated Validation

The platform performs several automated validation checks:

- **Schema Validation**: Ensures all required fields are present and properly formatted
- **Spatial Validation**: Checks for spatial errors (self-intersections, invalid geometries)
- **Referential Integrity**: Verifies relationships between datasets (e.g., parcel IDs in sales records exist in parcel data)
- **Data Range Validation**: Checks if values fall within expected ranges

### 3.2 Manual Validation Tasks

Review the following validation reports:

- **Validation Summary**: Shows overall success/failure rates
- **Error Report**: Lists all critical errors that must be fixed
- **Warning Report**: Lists potential issues that should be reviewed but won't block import
- **Data Quality Metrics**: Shows statistics about the data

### 3.3 Resolving Validation Issues

For each validation issue:
1. Review the error details
2. Determine if it requires fixing in the source data or can be addressed in the field mapping
3. For critical errors, fix the source data and re-upload
4. For warnings, decide whether to accept or fix

## 4. Configuration Phase

### 4.1 Spatial Configuration

Configure county-specific spatial settings:
- Coordinate reference system
- Default map center and zoom level
- Base map layers to enable

### 4.2 Data Display Configuration

Configure how data is displayed:
- Primary parcel identifier field
- Fields to display in parcel info panel
- Custom field labels and formatting

### 4.3 Workflow Configuration

Configure county-specific workflow settings:
- Enable/disable specialized workflows
- Configure workflow step requirements
- Set up county-specific validation rules

### 4.4 User Access Configuration

Configure user access for county data:
- County administrator accounts
- Department-level access controls
- Public access settings

## 5. Activation Phase

### 5.1 Pre-Activation Checklist

Before activating the county, verify:
- [ ] All critical validation issues are resolved
- [ ] County administrators have reviewed the imported data
- [ ] All configuration settings have been approved
- [ ] User access has been properly configured
- [ ] Integration with county systems has been tested (if applicable)

### 5.2 County Activation

To activate the county:
1. Navigate to the county dashboard
2. Review the activation summary
3. Click "Activate County"
4. Confirm the activation

### 5.3 Post-Activation Verification

After activation, perform these checks:
- Verify data is accessible in all platform modules
- Test search functionality with sample parcels
- Verify that maps display correctly
- Check that valuation tools work correctly
- Ensure user permissions are working as expected

## Data Update Procedures

### Regular Updates

For regular (scheduled) updates to county data:
1. Prepare updated data files following the same format specifications
2. Navigate to "County Management" → "Update County Data"
3. Select the county and data type to update
4. Upload the new data file
5. The system will validate and process the updates
6. Review and approve the changes

### Emergency Updates

For emergency or out-of-cycle updates:
1. Contact platform support to schedule the update
2. Follow the same data preparation steps
3. Support will provide a special update link
4. Upload, validate, and approve as with regular updates
5. Document the reason for the emergency update

## Troubleshooting

### Common Import Issues

| Issue | Possible Solution |
|-------|------------------|
| Mismatched field names | Adjust field mapping or rename fields in source data |
| Invalid geometries | Use a GIS tool to repair geometries before upload |
| Character encoding issues | Ensure files are saved with UTF-8 encoding |
| Date format issues | Standardize dates to YYYY-MM-DD format |
| Missing required fields | Add the required fields to the source data |

### Support Resources

- Technical Support: support@terrafusion.com
- Documentation: https://docs.terrafusion.com
- Knowledge Base: https://kb.terrafusion.com

## Appendix

### A. Field Specifications

Detailed specifications for all required fields in each data type.

### B. Recommended Data Sources

Recommendations for obtaining or generating missing data.

### C. Data Quality Best Practices

Best practices for maintaining high data quality.

### D. Automation Options

Options for automating regular data updates.