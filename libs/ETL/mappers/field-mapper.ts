/**
 * Field Mapper for TerraFusion ETL Module
 * 
 * This class maps fields from county-specific schemas to the standard
 * TerraFusion data model.
 */

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: any) => any;
}

interface FieldMappingConfig {
  parcels?: FieldMapping[];
  plats?: FieldMapping[];
  tax_code?: FieldMapping[];
  [key: string]: FieldMapping[] | undefined;
}

export class FieldMapper {
  private config: FieldMappingConfig;

  /**
   * Create a new field mapper
   * 
   * @param config - Configuration for field mapping
   */
  constructor(config: FieldMappingConfig = {}) {
    // If no config provided, use default mappings
    this.config = config || this.getDefaultMappings();
  }

  /**
   * Map fields from county-specific schema to standard schema
   * 
   * @param record - The record to map
   * @param dataType - The type of data being mapped
   * @returns The mapped record
   */
  mapFields(record: Record<string, any>, dataType: string): Record<string, any> {
    const mappings = this.config[dataType] || [];
    const result: Record<string, any> = {};

    // Apply field mappings
    for (const mapping of mappings) {
      if (record[mapping.sourceField] !== undefined) {
        const value = mapping.transform 
          ? mapping.transform(record[mapping.sourceField]) 
          : record[mapping.sourceField];
        
        result[mapping.targetField] = value;
      }
    }

    // Handle unmapped fields - copy them directly
    if (mappings.length === 0) {
      return { ...record };
    }

    return result;
  }

  /**
   * Get default field mappings
   * 
   * @returns Default field mapping configuration
   */
  private getDefaultMappings(): FieldMappingConfig {
    return {
      parcels: [
        {
          sourceField: 'PIN',
          targetField: 'parcelId',
        },
        {
          sourceField: 'PROPERTY_ID',
          targetField: 'parcelId',
        },
        {
          sourceField: 'APN',
          targetField: 'parcelId',
        },
        {
          sourceField: 'OWNER',
          targetField: 'owner',
        },
        {
          sourceField: 'OWNER_NAME',
          targetField: 'owner',
        },
        {
          sourceField: 'ADDRESS',
          targetField: 'siteAddress',
        },
        {
          sourceField: 'SITE_ADDR',
          targetField: 'siteAddress',
        },
        {
          sourceField: 'PROPERTY_ADDRESS',
          targetField: 'siteAddress',
        },
        {
          sourceField: 'ACRES',
          targetField: 'acres',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'ACREAGE',
          targetField: 'acres',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'AREA_ACRES',
          targetField: 'acres',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'LAND_VALUE',
          targetField: 'landValue',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'IMPROVEMENT_VALUE',
          targetField: 'improvementValue',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'IMPRV_VAL',
          targetField: 'improvementValue',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'TOTAL_VALUE',
          targetField: 'totalValue',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'TOT_VAL',
          targetField: 'totalValue',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'ZONING',
          targetField: 'zoning',
        },
        {
          sourceField: 'ZONE_CODE',
          targetField: 'zoning',
        },
        {
          sourceField: 'LEGAL_DESC',
          targetField: 'legalDescription',
        },
        {
          sourceField: 'LEGAL_DESCRIPTION',
          targetField: 'legalDescription',
        },
        {
          sourceField: 'YEAR_BUILT',
          targetField: 'yearBuilt',
          transform: (value) => parseInt(value, 10)
        },
        {
          sourceField: 'YR_BLT',
          targetField: 'yearBuilt',
          transform: (value) => parseInt(value, 10)
        }
      ],
      plats: [
        {
          sourceField: 'PLAT_ID',
          targetField: 'platId',
        },
        {
          sourceField: 'PLAT_NO',
          targetField: 'platId',
        },
        {
          sourceField: 'PLAT_NUMBER',
          targetField: 'platId',
        },
        {
          sourceField: 'PLAT_NAME',
          targetField: 'platName',
        },
        {
          sourceField: 'NAME',
          targetField: 'platName',
        },
        {
          sourceField: 'RECORD_DATE',
          targetField: 'recordDate',
          transform: (value) => new Date(value).toISOString().split('T')[0]
        },
        {
          sourceField: 'RECORDED_DATE',
          targetField: 'recordDate',
          transform: (value) => new Date(value).toISOString().split('T')[0]
        },
        {
          sourceField: 'DATE_RECORDED',
          targetField: 'recordDate',
          transform: (value) => new Date(value).toISOString().split('T')[0]
        },
        {
          sourceField: 'PLAT_TYPE',
          targetField: 'platType',
        },
        {
          sourceField: 'TYPE',
          targetField: 'platType',
        }
      ],
      tax_code: [
        {
          sourceField: 'TAX_CODE',
          targetField: 'taxCode',
        },
        {
          sourceField: 'CODE',
          targetField: 'taxCode',
        },
        {
          sourceField: 'DISTRICT',
          targetField: 'district',
        },
        {
          sourceField: 'DIST_NAME',
          targetField: 'district',
        },
        {
          sourceField: 'DISTRICT_NAME',
          targetField: 'district',
        },
        {
          sourceField: 'RATE',
          targetField: 'taxRate',
          transform: (value) => parseFloat(value)
        },
        {
          sourceField: 'TAX_RATE',
          targetField: 'taxRate',
          transform: (value) => parseFloat(value)
        }
      ]
    };
  }
}