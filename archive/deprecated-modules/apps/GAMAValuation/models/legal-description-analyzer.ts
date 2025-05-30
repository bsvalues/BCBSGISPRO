/**
 * Legal Description Analyzer
 * 
 * This module provides functionality for analyzing and extracting information from
 * property legal descriptions using AI-powered natural language processing capabilities.
 * It integrates with OpenAI's API to parse complex legal text into structured data.
 */

import OpenAI from 'openai';
import { logger } from '../../../libs/DevOps/utils/logger';

// Create module-specific logger
const legalLogger = logger.withTags(['GAMAValuation', 'LegalDescriptionAnalyzer']);

/**
 * Coordinate information
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Boundary information
 */
export interface Boundary {
  description: string;
  coordinates?: Coordinate[];
  length?: number;
  bearing?: string;
}

/**
 * Property dimensions
 */
export interface PropertyDimensions {
  width?: number;
  length?: number;
  area?: number;
  areaUnit: string;
  irregularShape: boolean;
}

/**
 * Property location
 */
export interface PropertyLocation {
  plat?: string;
  block?: string;
  lot?: string;
  subdivision?: string;
  section?: string;
  township?: string;
  range?: string;
  county?: string;
  state?: string;
}

/**
 * Reference points
 */
export interface ReferencePoints {
  pointOfBeginning?: Coordinate;
  corners?: Coordinate[];
  landmarks?: {
    name: string;
    location?: Coordinate;
    description: string;
  }[];
}

/**
 * Easement information
 */
export interface Easement {
  type: string;
  description: string;
  area?: number;
  areaUnit?: string;
  boundaries?: Boundary[];
}

/**
 * Issue level
 */
export enum IssueLevel {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Issue in legal description
 */
export interface Issue {
  level: IssueLevel;
  message: string;
  location?: {
    startIndex: number;
    endIndex: number;
  };
}

/**
 * Analyzed description result
 */
export interface AnalyzedDescription {
  // Original input
  originalText: string;
  
  // Basic information
  propertyType: string;
  estimatedPropertyType: string;
  propertyDimensions: PropertyDimensions;
  propertyLocation: PropertyLocation;
  
  // Geographic information
  boundaries: Boundary[];
  referencePoints: ReferencePoints;
  
  // Restrictions and rights
  easements: Easement[];
  restrictions: string[];
  
  // Analysis information
  confidence: number;
  errors: Issue[];
  warnings: Issue[];
  notes: Issue[];
  
  // Simplified description
  simplifiedDescription: string;
  
  // Geospatial data
  geoJSON?: any;
}

/**
 * Analysis request options
 */
export interface AnalysisOptions {
  includeGeospatialData?: boolean;
  generateSimplifiedDescription?: boolean;
  validateBoundaries?: boolean;
  confidenceThreshold?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Default analysis options
 */
const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  includeGeospatialData: true,
  generateSimplifiedDescription: true,
  validateBoundaries: true,
  confidenceThreshold: 0.7,
  maxTokens: 4000,
  model: 'gpt-4o'
};

/**
 * Legal description analyzer
 */
export class LegalDescriptionAnalyzer {
  private openai: OpenAI;
  private isInitialized = false;
  
  /**
   * Constructor
   */
  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }
  
  /**
   * Initialize the analyzer with API key
   */
  public initialize(apiKey: string): void {
    try {
      this.openai = new OpenAI({
        apiKey
      });
      
      this.isInitialized = true;
      legalLogger.info('Legal description analyzer initialized with OpenAI API');
    } catch (error) {
      legalLogger.error('Failed to initialize OpenAI client', error);
      throw new Error('Failed to initialize the legal description analyzer: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Check if the analyzer is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Analyze a legal description
   */
  public async analyze(
    legalDescription: string,
    options: AnalysisOptions = {}
  ): Promise<AnalyzedDescription> {
    // Merge with default options
    const mergedOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };
    
    // Validate initialization
    if (!this.isInitialized) {
      throw new Error('Legal description analyzer is not initialized. Call initialize() with a valid API key first.');
    }
    
    // Validate input
    if (!legalDescription || legalDescription.trim().length === 0) {
      throw new Error('Legal description cannot be empty');
    }
    
    legalLogger.info('Analyzing legal description', { 
      descriptionLength: legalDescription.length, 
      options: mergedOptions 
    });
    
    try {
      // Prepare the prompt
      const prompt = this.buildAnalysisPrompt(legalDescription, mergedOptions);
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: mergedOptions.model || DEFAULT_ANALYSIS_OPTIONS.model!,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: mergedOptions.maxTokens,
        temperature: 0.2, // Lower temperature for more deterministic results
        response_format: { type: "json_object" }
      });
      
      // Extract and parse the response
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }
      
      // Parse JSON response
      let parsedResult: AnalyzedDescription;
      try {
        parsedResult = JSON.parse(content) as AnalyzedDescription;
      } catch (parseError) {
        legalLogger.error('Failed to parse OpenAI response as JSON', { content, error: parseError });
        throw new Error('Failed to parse analysis result');
      }
      
      // Ensure the result has the original text
      parsedResult.originalText = legalDescription;
      
      // Add default empty arrays for issues if not present
      if (!parsedResult.errors) parsedResult.errors = [];
      if (!parsedResult.warnings) parsedResult.warnings = [];
      if (!parsedResult.notes) parsedResult.notes = [];
      
      // Validate the confidence level
      if (parsedResult.confidence < mergedOptions.confidenceThreshold!) {
        legalLogger.warn('Low confidence in legal description analysis', { 
          confidence: parsedResult.confidence, 
          threshold: mergedOptions.confidenceThreshold 
        });
        
        parsedResult.warnings.push({
          level: IssueLevel.WARNING,
          message: `Low confidence in analysis result (${(parsedResult.confidence * 100).toFixed(1)}%). Result may be inaccurate.`
        });
      }
      
      // Log analysis results
      legalLogger.info('Legal description analysis complete', {
        confidence: parsedResult.confidence,
        errorCount: parsedResult.errors.length,
        warningCount: parsedResult.warnings.length
      });
      
      return parsedResult;
    } catch (error) {
      legalLogger.error('Error analyzing legal description', error);
      throw new Error('Failed to analyze legal description: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Generate a simplified description from an analyzed description
   */
  public async generateSimplifiedDescription(
    analyzedDescription: AnalyzedDescription
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Legal description analyzer is not initialized. Call initialize() with a valid API key first.');
    }
    
    try {
      // If the simplified description already exists, return it
      if (analyzedDescription.simplifiedDescription) {
        return analyzedDescription.simplifiedDescription;
      }
      
      legalLogger.info('Generating simplified description');
      
      // Create a prompt for simplification
      const prompt = `
        Please create a simplified, plain English version of the following legal property description.
        Maintain all essential information but make it understandable to a non-expert:
        
        ${analyzedDescription.originalText}
      `;
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at simplifying legal property descriptions into clear, plain English that average property owners can understand. Maintain all key information but remove legal jargon.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });
      
      // Extract the response
      const simplifiedDescription = response.choices[0]?.message?.content || '';
      
      // Update the analyzed description
      analyzedDescription.simplifiedDescription = simplifiedDescription;
      
      legalLogger.info('Simplified description generated');
      
      return simplifiedDescription;
    } catch (error) {
      legalLogger.error('Error generating simplified description', error);
      throw new Error('Failed to generate simplified description: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Extract property information for valuation
   */
  public extractValuationData(
    analyzedDescription: AnalyzedDescription
  ): Record<string, any> {
    try {
      legalLogger.info('Extracting valuation data from analyzed description');
      
      // Extract key information for valuation
      const valuationData: Record<string, any> = {
        propertyType: analyzedDescription.propertyType,
        area: analyzedDescription.propertyDimensions.area,
        areaUnit: analyzedDescription.propertyDimensions.areaUnit,
        location: {
          plat: analyzedDescription.propertyLocation.plat,
          block: analyzedDescription.propertyLocation.block,
          lot: analyzedDescription.propertyLocation.lot,
          subdivision: analyzedDescription.propertyLocation.subdivision,
          section: analyzedDescription.propertyLocation.section,
          township: analyzedDescription.propertyLocation.township,
          range: analyzedDescription.propertyLocation.range,
          county: analyzedDescription.propertyLocation.county,
          state: analyzedDescription.propertyLocation.state
        },
        hasEasements: analyzedDescription.easements.length > 0,
        hasRestrictions: analyzedDescription.restrictions.length > 0,
        irregularShape: analyzedDescription.propertyDimensions.irregularShape
      };
      
      // Calculate additional metrics that might be relevant for valuation
      if (analyzedDescription.propertyDimensions.width && analyzedDescription.propertyDimensions.length) {
        valuationData.frontage = analyzedDescription.propertyDimensions.width;
        
        // Calculate frontage to depth ratio
        valuationData.frontageToDepthRatio = 
          analyzedDescription.propertyDimensions.width / analyzedDescription.propertyDimensions.length;
      }
      
      legalLogger.info('Valuation data extracted successfully');
      
      return valuationData;
    } catch (error) {
      legalLogger.error('Error extracting valuation data', error);
      throw new Error('Failed to extract valuation data: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Calculate property area from boundaries
   */
  public calculateAreaFromBoundaries(
    boundaries: Boundary[]
  ): { area: number; unit: string } | null {
    try {
      // This is a simplified implementation
      // In a real implementation, we would use a proper geospatial library
      
      // Check if we have coordinates for all boundaries
      const hasAllCoordinates = boundaries.every(b => b.coordinates && b.coordinates.length >= 2);
      
      if (!hasAllCoordinates) {
        legalLogger.warn('Cannot calculate area: missing coordinates in boundaries');
        return null;
      }
      
      // Since this is a simplified implementation, we'll return a placeholder
      // In a real implementation, we would calculate the area using the Shoelace formula
      return {
        area: 0,
        unit: 'square feet'
      };
    } catch (error) {
      legalLogger.error('Error calculating area from boundaries', error);
      return null;
    }
  }
  
  /**
   * Validate boundaries for consistency
   */
  public validateBoundaries(
    boundaries: Boundary[]
  ): Issue[] {
    const issues: Issue[] = [];
    
    try {
      // Check if the boundaries form a closed polygon
      if (boundaries.length < 3) {
        issues.push({
          level: IssueLevel.ERROR,
          message: 'A minimum of 3 boundaries is required to form a valid property boundary.'
        });
        return issues;
      }
      
      // Check if all boundaries have coordinates
      const missingCoordinates = boundaries.some(b => !b.coordinates || b.coordinates.length < 2);
      if (missingCoordinates) {
        issues.push({
          level: IssueLevel.WARNING,
          message: 'Some boundaries are missing complete coordinate information.'
        });
      }
      
      // In a real implementation, we would perform additional validation:
      // - Check if the polygon is closed
      // - Check for self-intersections
      // - Validate bearings and distances
      
      return issues;
    } catch (error) {
      legalLogger.error('Error validating boundaries', error);
      issues.push({
        level: IssueLevel.ERROR,
        message: 'Failed to validate boundaries: ' + (error instanceof Error ? error.message : String(error))
      });
      return issues;
    }
  }
  
  /**
   * Convert analysis to GeoJSON
   */
  public toGeoJSON(
    analyzedDescription: AnalyzedDescription
  ): any {
    try {
      // Check if GeoJSON already exists
      if (analyzedDescription.geoJSON) {
        return analyzedDescription.geoJSON;
      }
      
      // Check if we have enough data to create GeoJSON
      if (!analyzedDescription.boundaries || analyzedDescription.boundaries.length < 3) {
        legalLogger.warn('Cannot create GeoJSON: insufficient boundary data');
        return null;
      }
      
      // Extract coordinates from boundaries
      const coordinates: number[][][] = [];
      
      // Try to form a polygon from the boundaries
      const polygonCoordinates: number[][] = [];
      
      for (const boundary of analyzedDescription.boundaries) {
        if (boundary.coordinates && boundary.coordinates.length >= 2) {
          for (const coord of boundary.coordinates) {
            polygonCoordinates.push([coord.longitude, coord.latitude]);
          }
        }
      }
      
      // Ensure the polygon is closed
      if (polygonCoordinates.length > 0) {
        const firstPoint = polygonCoordinates[0];
        const lastPoint = polygonCoordinates[polygonCoordinates.length - 1];
        
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          polygonCoordinates.push([...firstPoint]);
        }
        
        coordinates.push(polygonCoordinates);
      }
      
      // Create GeoJSON object
      if (coordinates.length > 0) {
        const geoJSON = {
          type: 'Feature',
          properties: {
            propertyType: analyzedDescription.propertyType,
            area: analyzedDescription.propertyDimensions.area,
            areaUnit: analyzedDescription.propertyDimensions.areaUnit,
            description: analyzedDescription.simplifiedDescription || analyzedDescription.originalText
          },
          geometry: {
            type: 'Polygon',
            coordinates
          }
        };
        
        // Update the analyzed description
        analyzedDescription.geoJSON = geoJSON;
        
        return geoJSON;
      }
      
      return null;
    } catch (error) {
      legalLogger.error('Error creating GeoJSON', error);
      return null;
    }
  }
  
  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(
    legalDescription: string,
    options: AnalysisOptions
  ): string {
    return `
      Please analyze the following legal property description and extract structured information from it.
      Return your analysis as a JSON object following the format described in my system instructions.
      
      ${options.includeGeospatialData ? 'Include geospatial data in your analysis.' : ''}
      ${options.validateBoundaries ? 'Validate the property boundaries for consistency.' : ''}
      
      Legal description:
      """
      ${legalDescription}
      """
    `;
  }
  
  /**
   * Get the system prompt
   */
  private getSystemPrompt(): string {
    return `
      You are an expert system for analyzing real estate legal descriptions. Your task is to extract structured
      information from complex legal property descriptions and return the results in a specific JSON format.
      
      Analyze the provided legal description and return a JSON object with the following structure:
      
      {
        "propertyType": "string describing the property type (e.g., residential lot, commercial parcel)",
        "estimatedPropertyType": "more specific property classification if possible",
        "propertyDimensions": {
          "width": number or null,
          "length": number or null,
          "area": number or null,
          "areaUnit": "unit of area measurement (e.g., square feet, acres)",
          "irregularShape": boolean
        },
        "propertyLocation": {
          "plat": "plat or map reference",
          "block": "block number",
          "lot": "lot number",
          "subdivision": "subdivision name",
          "section": "section number",
          "township": "township identifier",
          "range": "range identifier",
          "county": "county name",
          "state": "state name"
        },
        "boundaries": [
          {
            "description": "text description of one boundary",
            "coordinates": [
              { "latitude": number, "longitude": number }
            ],
            "length": number or null,
            "bearing": "compass bearing if applicable"
          }
        ],
        "referencePoints": {
          "pointOfBeginning": { "latitude": number, "longitude": number } or null,
          "corners": [
            { "latitude": number, "longitude": number }
          ],
          "landmarks": [
            {
              "name": "landmark name",
              "location": { "latitude": number, "longitude": number } or null,
              "description": "description of the landmark"
            }
          ]
        },
        "easements": [
          {
            "type": "type of easement",
            "description": "description of the easement",
            "area": number or null,
            "areaUnit": "unit of area measurement",
            "boundaries": [
              {
                "description": "text description of boundary",
                "coordinates": [
                  { "latitude": number, "longitude": number }
                ]
              }
            ]
          }
        ],
        "restrictions": [
          "description of restriction"
        ],
        "confidence": number between 0 and 1 representing your confidence in the analysis,
        "errors": [
          {
            "level": "error",
            "message": "description of a critical issue found",
            "location": {
              "startIndex": number,
              "endIndex": number
            }
          }
        ],
        "warnings": [
          {
            "level": "warning",
            "message": "description of a potential issue"
          }
        ],
        "notes": [
          {
            "level": "info",
            "message": "informational note about the description"
          }
        ],
        "simplifiedDescription": "a plain English version of the legal description"
      }
      
      Guidelines:
      1. If you cannot determine a value with confidence, use null or an empty array as appropriate.
      2. Include any errors, warnings, or notes about the description.
      3. Set the confidence level based on your overall certainty about the analysis.
      4. If possible, convert textual measurements and directions into numeric values.
      5. For geospatial data, use latitude and longitude when possible.
      6. The simplifiedDescription should be in plain English but preserve all important details.
    `;
  }
}