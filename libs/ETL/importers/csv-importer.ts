/**
 * CSV Importer for TerraFusion ETL Module
 * 
 * This script imports CSV data from county sources, normalizes it to the TerraFusion
 * data model, and makes it available for use in the application.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { logger } from '../utils/logger';
import { FieldMapper } from '../mappers/field-mapper';
import { DataValidator } from '../validators/data-validator';
import { ImportLogger } from '../loggers/import-logger';

/**
 * Import CSV data from a county
 * 
 * @param countyName - The name of the county
 * @param dataType - The type of data being imported (parcels, plats, tax_code)
 * @param options - Additional options for the import process
 * @returns A summary of the import process
 */
export async function importCSVData(
  countyName: string,
  dataType: 'parcels' | 'plats' | 'tax_code',
  options: {
    validateData?: boolean;
    logImport?: boolean;
    fieldMappingFile?: string;
  } = {}
) {
  const {
    validateData = true,
    logImport = true,
    fieldMappingFile
  } = options;

  try {
    // Configure paths
    const dataDir = path.join(process.cwd(), 'data', countyName, dataType);
    const fieldMapPath = fieldMappingFile || path.join(dataDir, 'field-mapping.json');
    const logDir = path.join(process.cwd(), 'logs', 'etl');
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Find CSV files in the data directory
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));
    
    if (files.length === 0) {
      throw new Error(`No CSV files found in ${dataDir}`);
    }
    
    // Initialize loggers and mappers
    const importLogger = new ImportLogger({
      logDir,
      countyName,
      dataType
    });
    
    let fieldMapper;
    if (fs.existsSync(fieldMapPath)) {
      const fieldMappingConfig = JSON.parse(fs.readFileSync(fieldMapPath, 'utf8'));
      fieldMapper = new FieldMapper(fieldMappingConfig);
    } else {
      logger.warn(`No field mapping found at ${fieldMapPath}, using default mapping`);
      fieldMapper = new FieldMapper();
    }
    
    // Process each CSV file
    const results = [];
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      logger.info(`Processing ${filePath}`);
      
      // Read and parse CSV
      const csvData = fs.readFileSync(filePath, 'utf8');
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Map fields to standard schema
      const mappedRecords = records.map(record => fieldMapper.mapFields(record, dataType));
      
      // Validate data if requested
      let validationResults = null;
      if (validateData) {
        const validator = new DataValidator();
        validationResults = await validator.validateData(mappedRecords, dataType);
        
        if (validationResults.errors.length > 0) {
          logger.warn(`Validation found ${validationResults.errors.length} errors in ${file}`);
          // Write validation errors to file
          fs.writeFileSync(
            path.join(logDir, `${countyName}-${dataType}-${path.basename(file, '.csv')}-validation.json`),
            JSON.stringify(validationResults, null, 2)
          );
        }
      }
      
      // Log import if requested
      if (logImport) {
        await importLogger.logImport({
          fileName: file,
          recordCount: records.length,
          validationResults
        });
      }
      
      // Add to results
      results.push({
        file,
        recordCount: records.length,
        mappedCount: mappedRecords.length,
        validationErrors: validationResults?.errors.length || 0
      });
      
      // Write mapped data to output file
      const outputDir = path.join(process.cwd(), 'data', countyName, `${dataType}-processed`);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(outputDir, `${path.basename(file, '.csv')}-processed.json`),
        JSON.stringify(mappedRecords, null, 2)
      );
    }
    
    // Return summary of import process
    return {
      county: countyName,
      dataType,
      fileCount: files.length,
      totalRecords: results.reduce((sum, result) => sum + result.recordCount, 0),
      totalMappedRecords: results.reduce((sum, result) => sum + result.mappedCount, 0),
      totalValidationErrors: results.reduce((sum, result) => sum + result.validationErrors, 0),
      files: results
    };
  } catch (error) {
    logger.error(`Error importing CSV data for ${countyName} ${dataType}:`, error);
    throw error;
  }
}

// Allow direct execution from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const countyArg = args.find(arg => arg.startsWith('--county='));
  const dataTypeArg = args.find(arg => arg.startsWith('--dataType='));
  
  if (!countyArg || !dataTypeArg) {
    console.error('Usage: node csv-importer.js --county=<county-name> --dataType=<parcels|plats|tax_code>');
    process.exit(1);
  }
  
  const county = countyArg.split('=')[1];
  const dataType = dataTypeArg.split('=')[1] as 'parcels' | 'plats' | 'tax_code';
  
  importCSVData(county, dataType)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}