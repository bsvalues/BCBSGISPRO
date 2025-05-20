/**
 * Legal Description Analyzer
 * 
 * This module provides AI-powered analysis of legal descriptions
 * for property parcels, extracting structured data and validating
 * the descriptions for accuracy and completeness.
 */

import { OpenAI } from 'openai';
import { logger } from '../../../libs/DevOps/utils/logger';

// Create module-specific logger
const legalLogger = logger.withTags(['GAMAValuation', 'LegalAnalyzer']);

/**
 * Legal description types
 */
export enum LegalDescriptionType {
  METES_AND_BOUNDS = 'metes_and_bounds',
  RECTANGULAR_SURVEY = 'rectangular_survey',
  LOT_AND_BLOCK = 'lot_and_block',
  SUBDIVISION = 'subdivision',
  MIXED = 'mixed',
  OTHER = 'other',
  UNKNOWN = 'unknown'
}

/**
 * Direction types for bearings
 */
export type Direction = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';

/**
 * Unit of measurement
 */
export type Unit = 'feet' | 'meters' | 'chains' | 'rods' | 'links';

/**
 * Bearing in a metes and bounds description
 */
export interface Bearing {
  direction: Direction;
  degrees?: number;
  minutes?: number;
  seconds?: number;
  distance: number;
  unit: Unit;
}

/**
 * Section-Township-Range reference
 */
export interface SectionTownshipRange {
  section: number;
  township: number;
  townshipDirection: 'N' | 'S';
  range: number;
  rangeDirection: 'E' | 'W';
  quarterSection?: string;
  meridian?: string;
}

/**
 * Lot and block reference
 */
export interface LotBlock {
  lot: string | number;
  block: string | number;
  subdivision: string;
  plat?: {
    book: string;
    page: string;
  };
}

/**
 * Structured legal description data
 */
export interface StructuredLegalDescription {
  // Original text
  rawText: string;
  
  // Identified type
  type: LegalDescriptionType;
  
  // Extracted information based on type
  metesAndBounds?: {
    startingPoint: string;
    bearings: Bearing[];
    closesLoop: boolean;
  };
  
  rectangularSurvey?: SectionTownshipRange;
  
  lotAndBlock?: LotBlock;
  
  // Common elements
  county: string;
  state: string;
  exceptions?: string[];
  
  // Validation results
  validation: {
    isValid: boolean;
    issues: string[];
    confidence: number;
  };
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  county?: string;
  state?: string;
  doValidation?: boolean;
  extractGeometry?: boolean;
}

/**
 * Default analysis options
 */
const defaultOptions: AnalysisOptions = {
  doValidation: true,
  extractGeometry: true
};

/**
 * Legal Description Analyzer
 */
export class LegalDescriptionAnalyzer {
  private openai: OpenAI | null = null;
  private modelName: string = 'gpt-4';
  
  /**
   * Initialize the analyzer
   */
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey
        });
        
        legalLogger.info('Legal Description Analyzer initialized with OpenAI integration');
      } catch (error) {
        legalLogger.error('Failed to initialize OpenAI client', error);
      }
    } else {
      legalLogger.warn('OpenAI API key not provided. Legal description analysis will be limited.');
    }
  }
  
  /**
   * Analyze a legal description
   * 
   * @param legalDescription The legal description text
   * @param options Analysis options
   * @returns Structured legal description data
   */
  async analyze(
    legalDescription: string,
    options: AnalysisOptions = {}
  ): Promise<StructuredLegalDescription> {
    // Merge with default options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Check if OpenAI client is available
    if (!this.openai) {
      legalLogger.error('OpenAI client not available for legal description analysis');
      return this.fallbackAnalysis(legalDescription, mergedOptions);
    }
    
    try {
      legalLogger.info('Analyzing legal description', {
        metadata: {
          length: legalDescription.length,
          county: mergedOptions.county,
          state: mergedOptions.state
        }
      });
      
      // Start timing
      const startTime = Date.now();
      
      // Create analysis prompt
      const prompt = this.createAnalysisPrompt(legalDescription, mergedOptions);
      
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert land surveyor and legal analyst who specializes in parsing and analyzing property legal descriptions. Extract structured information from the legal description provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      const response = completion.choices[0].message.content;
      
      if (!response) {
        throw new Error('Empty response from OpenAI API');
      }
      
      // Parse the JSON response
      let parsedResult: StructuredLegalDescription;
      
      try {
        parsedResult = JSON.parse(response) as StructuredLegalDescription;
      } catch (error) {
        legalLogger.error('Failed to parse OpenAI response', error, {
          metadata: { response }
        });
        throw new Error('Failed to parse OpenAI response');
      }
      
      // Ensure raw text is included
      parsedResult.rawText = legalDescription;
      
      // Log completion time
      const duration = Date.now() - startTime;
      legalLogger.info(`Legal description analysis completed in ${duration}ms`, {
        metadata: {
          type: parsedResult.type,
          isValid: parsedResult.validation.isValid,
          confidence: parsedResult.validation.confidence,
          duration
        }
      });
      
      return parsedResult;
    } catch (error) {
      legalLogger.error('Error analyzing legal description', error);
      
      // Fall back to basic analysis
      return this.fallbackAnalysis(legalDescription, mergedOptions);
    }
  }
  
  /**
   * Create a prompt for analysis
   * 
   * @param legalDescription The legal description text
   * @param options Analysis options
   * @returns Prompt text
   */
  private createAnalysisPrompt(
    legalDescription: string,
    options: AnalysisOptions
  ): string {
    let prompt = `
      Analyze the following legal description and extract structured information from it.
      If known, the property is located in ${options.county || 'unknown'} County, ${options.state || 'unknown'}.
      
      Legal Description:
      """
      ${legalDescription}
      """
      
      Identify the type of legal description (metes and bounds, rectangular survey, lot and block, etc.).
      
      Extract all relevant information based on the type:
      - For metes and bounds: extract starting point, bearings (direction, degrees, minutes, seconds, distance), and determine if the description forms a closed loop.
      - For rectangular survey (PLSS): extract section, township, range, and any quarter sections.
      - For lot and block: extract lot number, block number, subdivision name, and any plat references.
      
      ${options.doValidation ? 'Validate the description for accuracy, completeness, and internal consistency. List any issues found.' : ''}
      
      Provide your response as a JSON object with the following structure:
      {
        "type": "metes_and_bounds|rectangular_survey|lot_and_block|subdivision|mixed|other|unknown",
        "metesAndBounds": {
          "startingPoint": "string",
          "bearings": [
            {
              "direction": "string",
              "degrees": number,
              "minutes": number,
              "seconds": number,
              "distance": number,
              "unit": "string"
            }
          ],
          "closesLoop": boolean
        },
        "rectangularSurvey": {
          "section": number,
          "township": number,
          "townshipDirection": "N|S",
          "range": number,
          "rangeDirection": "E|W",
          "quarterSection": "string",
          "meridian": "string"
        },
        "lotAndBlock": {
          "lot": "string or number",
          "block": "string or number",
          "subdivision": "string",
          "plat": {
            "book": "string",
            "page": "string"
          }
        },
        "county": "string",
        "state": "string",
        "exceptions": ["string"],
        "validation": {
          "isValid": boolean,
          "issues": ["string"],
          "confidence": number (0.0 to 1.0)
        }
      }
      
      Only include the relevant fields based on the identified type. For example, if it's a lot and block description, you don't need to include metesAndBounds or rectangularSurvey fields.
    `;
    
    return prompt;
  }
  
  /**
   * Basic fallback analysis when AI is unavailable
   * 
   * @param legalDescription The legal description text
   * @param options Analysis options
   * @returns Basic structured legal description
   */
  private fallbackAnalysis(
    legalDescription: string,
    options: AnalysisOptions
  ): StructuredLegalDescription {
    legalLogger.info('Performing fallback analysis of legal description');
    
    // Attempt to determine the type based on keywords
    let type = LegalDescriptionType.UNKNOWN;
    
    if (/township|range|section|quarter|meridian|t\d+[ns]|r\d+[ew]/i.test(legalDescription)) {
      type = LegalDescriptionType.RECTANGULAR_SURVEY;
    } else if (/lot\s+\d+|block\s+\d+|subdivision|addition/i.test(legalDescription)) {
      type = LegalDescriptionType.LOT_AND_BLOCK;
    } else if (/degrees|minutes|seconds|bears|feet|meters|chains|north|south|east|west|thence/i.test(legalDescription)) {
      type = LegalDescriptionType.METES_AND_BOUNDS;
    }
    
    return {
      rawText: legalDescription,
      type,
      county: options.county || 'Unknown',
      state: options.state || 'Unknown',
      validation: {
        isValid: false,
        issues: ['AI analysis unavailable, validation could not be performed'],
        confidence: 0.1
      }
    };
  }
  
  /**
   * Extract geometry from a structured legal description
   * 
   * @param structuredDescription Structured legal description
   * @returns GeoJSON geometry object
   */
  extractGeometry(structuredDescription: StructuredLegalDescription): any {
    // In a real implementation, this would convert the structured description
    // to actual GeoJSON geometry. For now, this is a placeholder.
    
    legalLogger.info('Geometry extraction requested', {
      metadata: {
        descriptionType: structuredDescription.type
      }
    });
    
    if (structuredDescription.type === LegalDescriptionType.METES_AND_BOUNDS && 
        structuredDescription.metesAndBounds?.bearings) {
      // This would convert bearings to a polygon
      return {
        type: 'Polygon',
        coordinates: [[[0, 0]]] // Placeholder
      };
    }
    
    return null;
  }
  
  /**
   * Check if two legal descriptions match or describe the same property
   * 
   * @param description1 First legal description
   * @param description2 Second legal description
   * @returns Match result with confidence score
   */
  async compareDescriptions(
    description1: string,
    description2: string
  ): Promise<{
    isMatch: boolean;
    confidence: number;
    explanation: string;
  }> {
    if (!this.openai) {
      return {
        isMatch: false,
        confidence: 0,
        explanation: 'OpenAI API not available for comparison'
      };
    }
    
    try {
      // Analyze both descriptions
      const [analysis1, analysis2] = await Promise.all([
        this.analyze(description1),
        this.analyze(description2)
      ]);
      
      // If types don't match, likely not the same property
      if (analysis1.type !== analysis2.type && 
          analysis1.type !== LegalDescriptionType.MIXED && 
          analysis2.type !== LegalDescriptionType.MIXED) {
        return {
          isMatch: false,
          confidence: 0.8,
          explanation: `Description types don't match: ${analysis1.type} vs ${analysis2.type}`
        };
      }
      
      // For rectangular survey, compare section-township-range
      if (analysis1.rectangularSurvey && analysis2.rectangularSurvey) {
        const rs1 = analysis1.rectangularSurvey;
        const rs2 = analysis2.rectangularSurvey;
        
        if (rs1.section === rs2.section && 
            rs1.township === rs2.township && 
            rs1.townshipDirection === rs2.townshipDirection && 
            rs1.range === rs2.range && 
            rs1.rangeDirection === rs2.rangeDirection) {
          
          // If quarter sections are specified, compare them too
          if (rs1.quarterSection && rs2.quarterSection) {
            if (rs1.quarterSection === rs2.quarterSection) {
              return {
                isMatch: true,
                confidence: 0.95,
                explanation: 'Identical section-township-range references with matching quarter sections'
              };
            } else {
              return {
                isMatch: false,
                confidence: 0.9,
                explanation: 'Same section-township-range but different quarter sections'
              };
            }
          }
          
          return {
            isMatch: true,
            confidence: 0.8,
            explanation: 'Identical section-township-range references'
          };
        }
      }
      
      // For lot and block, compare subdivision, lot, and block
      if (analysis1.lotAndBlock && analysis2.lotAndBlock) {
        const lb1 = analysis1.lotAndBlock;
        const lb2 = analysis2.lotAndBlock;
        
        if (lb1.subdivision === lb2.subdivision && 
            lb1.lot === lb2.lot && 
            lb1.block === lb2.block) {
          return {
            isMatch: true,
            confidence: 0.95,
            explanation: 'Identical lot, block, and subdivision references'
          };
        }
      }
      
      // For more complex cases, use OpenAI to compare
      const prompt = `
        Compare these two legal descriptions and determine if they describe the same property:
        
        Description 1:
        """
        ${description1}
        """
        
        Description 2:
        """
        ${description2}
        """
        
        Analyze the details of both descriptions and explain whether they refer to the same property.
        Provide your conclusion as JSON with the following fields:
        - isMatch (boolean): true if they describe the same property, false otherwise
        - confidence (number): a value between 0.0 and 1.0 indicating your confidence in this assessment
        - explanation (string): a brief explanation of your reasoning
      `;
      
      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert land surveyor who specializes in comparing legal descriptions to determine if they refer to the same property.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      const response = completion.choices[0].message.content;
      
      if (!response) {
        throw new Error('Empty response from OpenAI API');
      }
      
      return JSON.parse(response) as {
        isMatch: boolean;
        confidence: number;
        explanation: string;
      };
    } catch (error) {
      legalLogger.error('Error comparing legal descriptions', error);
      
      return {
        isMatch: false,
        confidence: 0,
        explanation: `Error comparing descriptions: ${error.message}`
      };
    }
  }
}