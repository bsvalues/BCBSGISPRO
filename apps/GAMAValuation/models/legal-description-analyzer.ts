/**
 * Legal Description Analyzer
 * 
 * This module uses AI to parse, analyze, and normalize legal property descriptions.
 * It can extract key information such as section, township, range, lot numbers,
 * and metes and bounds from unstructured text.
 */

import { logger } from '../../../libs/DevOps/utils/logger';
import OpenAI from 'openai';

// Create module-specific logger
const legalLogger = logger.withTags(['GAMAValuation', 'LegalAnalyzer']);

/**
 * Description format types
 */
export enum DescriptionFormat {
  PLSS = 'plss', // Public Land Survey System (Section, Township, Range)
  METES_AND_BOUNDS = 'metes_and_bounds', // Direction and distance measurements
  LOT_BLOCK = 'lot_block', // Subdivision lot and block
  TAX_PARCEL = 'tax_parcel', // Tax parcel identifier
  MIXED = 'mixed', // Combination of formats
  UNKNOWN = 'unknown' // Couldn't determine format
}

/**
 * Direction type for metes and bounds
 */
export enum Direction {
  NORTH = 'N',
  EAST = 'E',
  SOUTH = 'S',
  WEST = 'W',
  NORTHEAST = 'NE',
  SOUTHEAST = 'SE',
  SOUTHWEST = 'SW',
  NORTHWEST = 'NW'
}

/**
 * Public Land Survey System (PLSS) components
 */
export interface PLSSComponents {
  section?: number | string;
  township?: {
    number: number;
    direction: 'N' | 'S';
  };
  range?: {
    number: number;
    direction: 'E' | 'W';
  };
  quarterSection?: string;
  governmentLot?: string | number;
  meridian?: string;
  aliquotParts?: string[];
}

/**
 * Lot and block components
 */
export interface LotBlockComponents {
  lot?: string | number;
  block?: string | number;
  subdivision?: string;
  tract?: string;
  phase?: string | number;
  unit?: string | number;
  addition?: string;
}

/**
 * Metes and bounds segment
 */
export interface MetesBoundsSegment {
  direction: Direction;
  degrees?: number;
  minutes?: number;
  seconds?: number;
  distance: number;
  unit: 'feet' | 'meters' | 'chains' | 'links' | 'rods' | 'yards';
  point?: string;
  description?: string;
}

/**
 * Tax parcel components
 */
export interface TaxParcelComponents {
  number: string;
  county?: string;
  state?: string;
  assessorId?: string;
}

/**
 * Analyzed description result
 */
export interface AnalyzedDescription {
  // Original text
  originalText: string;
  
  // Normalized text
  normalizedText: string;
  
  // Detected format
  format: DescriptionFormat;
  
  // Confidence score (0-1)
  confidence: number;
  
  // Extracted components
  plss?: PLSSComponents;
  lotBlock?: LotBlockComponents;
  metesBounds?: MetesBoundsSegment[];
  taxParcel?: TaxParcelComponents;
  
  // Detected boundaries (if available)
  boundaries?: GeoJSON.Polygon;
  
  // Geographic position (if available)
  position?: {
    latitude: number;
    longitude: number;
  };
  
  // Approximate area (if available)
  area?: {
    value: number;
    unit: 'acres' | 'square_feet' | 'square_meters' | 'hectares';
  };
  
  // Analysis metadata
  metadata: {
    analyzedAt: Date;
    processingTimeMs: number;
    model?: string;
    errors?: string[];
    warnings?: string[];
    notes?: string[];
  };
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  extractBoundaries?: boolean;
  normalizeText?: boolean;
  validateDescription?: boolean;
  verbose?: boolean;
  defaultState?: string;
  defaultCounty?: string;
  model?: string;
}

/**
 * Legal Description Analyzer Class
 */
export class LegalDescriptionAnalyzer {
  private openai: OpenAI;
  private defaultOptions: AnalysisOptions = {
    extractBoundaries: false,
    normalizeText: true,
    validateDescription: true,
    verbose: false,
    model: 'gpt-4o'
  };
  
  /**
   * Create a new Legal Description Analyzer
   */
  constructor(apiKey?: string) {
    if (!apiKey) {
      // Try to get API key from environment variable
      apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key is required. Provide it in the constructor or set the OPENAI_API_KEY environment variable.');
      }
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
    
    legalLogger.info('Legal Description Analyzer initialized');
  }
  
  /**
   * Analyze legal description text
   */
  async analyze(
    description: string,
    options: AnalysisOptions = {}
  ): Promise<AnalyzedDescription> {
    // Start timing
    const startTime = Date.now();
    
    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      legalLogger.info('Analyzing legal description', { 
        descriptionLength: description.length,
        options: mergedOptions
      });
      
      // Validate input
      if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new Error('Invalid legal description: Description is empty or not a string');
      }
      
      // Normalize text if requested
      const normalizedText = mergedOptions.normalizeText 
        ? this.normalizeDescription(description)
        : description;
      
      // Determine format using pattern matching
      const detectedFormat = this.detectFormat(normalizedText);
      
      // Use AI to analyze the description
      const aiAnalysisResult = await this.analyzeWithAI(normalizedText, detectedFormat, mergedOptions);
      
      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;
      
      // Create final result
      const result: AnalyzedDescription = {
        originalText: description,
        normalizedText,
        format: aiAnalysisResult.format || detectedFormat,
        confidence: aiAnalysisResult.confidence || 0.5,
        plss: aiAnalysisResult.plss,
        lotBlock: aiAnalysisResult.lotBlock,
        metesBounds: aiAnalysisResult.metesBounds,
        taxParcel: aiAnalysisResult.taxParcel,
        boundaries: aiAnalysisResult.boundaries,
        position: aiAnalysisResult.position,
        area: aiAnalysisResult.area,
        metadata: {
          analyzedAt: new Date(),
          processingTimeMs,
          model: mergedOptions.model,
          errors: aiAnalysisResult.errors,
          warnings: aiAnalysisResult.warnings,
          notes: aiAnalysisResult.notes
        }
      };
      
      legalLogger.info('Legal description analysis complete', { 
        format: result.format,
        confidence: result.confidence,
        processingTimeMs
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      legalLogger.error(`Legal description analysis failed: ${errorMessage}`, error);
      
      // Return a basic result with error information
      return {
        originalText: description,
        normalizedText: description,
        format: DescriptionFormat.UNKNOWN,
        confidence: 0,
        metadata: {
          analyzedAt: new Date(),
          processingTimeMs: Date.now() - startTime,
          errors: [errorMessage]
        }
      };
    }
  }
  
  /**
   * Normalize legal description text
   */
  private normalizeDescription(text: string): string {
    // Remove multiple spaces
    let normalized = text.replace(/\s+/g, ' ');
    
    // Convert to uppercase
    normalized = normalized.toUpperCase();
    
    // Normalize common abbreviations
    const abbreviationMap: Record<string, string> = {
      'N\\.': 'NORTH',
      'S\\.': 'SOUTH',
      'E\\.': 'EAST',
      'W\\.': 'WEST',
      'N\\.E\\.': 'NORTHEAST',
      'S\\.E\\.': 'SOUTHEAST',
      'S\\.W\\.': 'SOUTHWEST',
      'N\\.W\\.': 'NORTHWEST',
      'SEC\\.': 'SECTION',
      'TWP\\.': 'TOWNSHIP',
      'T\\.': 'TOWNSHIP',
      'R\\.': 'RANGE',
      'PT\\.': 'POINT',
      'FT\\.': 'FEET',
      'SQ\\.': 'SQUARE'
    };
    
    // Replace abbreviations
    for (const [abbr, full] of Object.entries(abbreviationMap)) {
      normalized = normalized.replace(new RegExp(abbr, 'g'), full);
    }
    
    // Standardize punctuation
    normalized = normalized.replace(/[,;]/g, ' ');
    
    // Clean the result
    normalized = normalized.trim();
    
    return normalized;
  }
  
  /**
   * Detect format using pattern matching
   */
  private detectFormat(text: string): DescriptionFormat {
    // Check for PLSS format (Section, Township, Range)
    const plssPattern = /SECTION|SEC|TOWNSHIP|TWP|T\s?\d+[NS]|R\s?\d+[EW]|R\.\s?\d+\s?[EW]|\bS\d+\b|\bT\d+[NS]\b|\bR\d+[EW]\b/i;
    if (plssPattern.test(text)) {
      return DescriptionFormat.PLSS;
    }
    
    // Check for Metes and Bounds format
    const mAndBPattern = /(?:NORTH|SOUTH|EAST|WEST|N|S|E|W|NE|SE|SW|NW)\s+\d+(?:\.\d+)?\s*(?:DEGREES|°)|\d+(?:\.\d+)?\s*(?:FEET|METERS|CHAINS|LINKS|FT)/i;
    if (mAndBPattern.test(text)) {
      return DescriptionFormat.METES_AND_BOUNDS;
    }
    
    // Check for Lot/Block format
    const lotBlockPattern = /LOT\s+\d+|BLOCK\s+\d+|SUBDIVISION|ADDITION|PHASE|UNIT|TRACT/i;
    if (lotBlockPattern.test(text)) {
      return DescriptionFormat.LOT_BLOCK;
    }
    
    // Check for Tax Parcel format (typically alphanumeric with special formatting)
    const taxParcelPattern = /(?:TAX\s+(?:PARCEL|LOT|MAP)|PARCEL\s+(?:NUMBER|ID|NO))[:\s]+[\w\d-]+/i;
    if (taxParcelPattern.test(text)) {
      return DescriptionFormat.TAX_PARCEL;
    }
    
    // If multiple patterns match, it's a mixed format
    let matchCount = 0;
    if (plssPattern.test(text)) matchCount++;
    if (mAndBPattern.test(text)) matchCount++;
    if (lotBlockPattern.test(text)) matchCount++;
    if (taxParcelPattern.test(text)) matchCount++;
    
    if (matchCount > 1) {
      return DescriptionFormat.MIXED;
    }
    
    // If no patterns match, it's unknown
    return DescriptionFormat.UNKNOWN;
  }
  
  /**
   * Analyze legal description using OpenAI
   */
  private async analyzeWithAI(
    text: string, 
    detectedFormat: DescriptionFormat,
    options: AnalysisOptions
  ): Promise<Partial<AnalyzedDescription>> {
    // Create system prompt
    const systemPrompt = this.createSystemPrompt(detectedFormat, options);
    
    // Create user prompt
    const userPrompt = `Legal Description to Analyze: "${text}"`;
    
    try {
      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      // Extract and parse the response
      const responseText = response.choices[0]?.message?.content || '{}';
      
      try {
        const parsedResponse = JSON.parse(responseText);
        
        // Transform the response into our expected format
        return this.transformAIResponse(parsedResponse);
      } catch (parseError) {
        legalLogger.error('Failed to parse AI response as JSON', { responseText, error: parseError });
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      legalLogger.error('OpenAI API request failed', error);
      throw new Error(`OpenAI API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create system prompt for OpenAI
   */
  private createSystemPrompt(detectedFormat: DescriptionFormat, options: AnalysisOptions): string {
    return `
You are a specialized legal description analyzer for the TerraFusion property assessment platform. Your task is to analyze legal property descriptions and extract structured data.

DETECTED FORMAT: ${detectedFormat}

INSTRUCTIONS:
1. Analyze the legal description provided by the user.
2. Extract all relevant components based on the description format.
3. Return a structured JSON response with all extracted information.
4. For each component, include a confidence score (0-1) indicating your certainty.
5. If you notice any errors or ambiguities in the description, note them.
6. Standardize abbreviations and formats in the normalized output.

${options.verbose ? `
DETAILED INSTRUCTION FOR EACH FORMAT:

PLSS (Public Land Survey System):
- Extract section, township (with direction), range (with direction)
- Identify any quarter sections or aliquot parts
- Note the principal meridian if mentioned

Metes and Bounds:
- Extract each segment with direction, degrees/minutes/seconds, distance and unit
- Note any reference points or monuments
- Order the segments sequentially as they appear in the description

Lot and Block:
- Extract lot number, block number, subdivision name
- Note any phase, unit, or addition information
- Include plat book references if mentioned

Tax Parcel:
- Extract the full parcel number
- Note county and state information if provided
- Include any assessor's identification numbers
` : ''}

The response MUST be a valid JSON object with the following structure:
{
  "format": "plss|metes_and_bounds|lot_block|tax_parcel|mixed|unknown",
  "confidence": 0.95,
  "plss": {
    "section": 10,
    "township": { "number": 24, "direction": "N" },
    "range": { "number": 5, "direction": "E" },
    "quarterSection": "SW1/4",
    "aliquotParts": ["NE1/4", "of", "SW1/4"]
  },
  "lotBlock": {
    "lot": "12",
    "block": "B",
    "subdivision": "MEADOW VIEW ESTATES"
  },
  "metesBounds": [
    {
      "direction": "N",
      "degrees": 45,
      "minutes": 30,
      "seconds": 15,
      "distance": 100,
      "unit": "feet"
    }
  ],
  "taxParcel": {
    "number": "123-456-789"
  },
  "boundaries": GeoJSON Polygon (if extractable),
  "position": { "latitude": 47.123, "longitude": -122.456 },
  "area": { "value": 5.25, "unit": "acres" },
  "errors": ["Description missing principal meridian"],
  "warnings": ["Possible typo in section number"],
  "notes": ["Common abbreviations expanded in normalized text"]
}

Only include the components that apply to the description format. Return null for components that don't apply.
Your response must be parseable JSON with no markdown formatting or additional text.`;
  }
  
  /**
   * Transform AI response to our expected format
   */
  private transformAIResponse(response: any): Partial<AnalyzedDescription> {
    // Basic validation
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid AI response format');
    }
    
    // Transform the response
    const result: Partial<AnalyzedDescription> = {
      format: response.format as DescriptionFormat,
      confidence: response.confidence || 0.5
    };
    
    // Add PLSS components if present
    if (response.plss && typeof response.plss === 'object') {
      result.plss = response.plss as PLSSComponents;
    }
    
    // Add Lot/Block components if present
    if (response.lotBlock && typeof response.lotBlock === 'object') {
      result.lotBlock = response.lotBlock as LotBlockComponents;
    }
    
    // Add Metes and Bounds components if present
    if (response.metesBounds && Array.isArray(response.metesBounds)) {
      result.metesBounds = response.metesBounds as MetesBoundsSegment[];
    }
    
    // Add Tax Parcel components if present
    if (response.taxParcel && typeof response.taxParcel === 'object') {
      result.taxParcel = response.taxParcel as TaxParcelComponents;
    }
    
    // Add boundaries if present
    if (response.boundaries) {
      result.boundaries = response.boundaries as GeoJSON.Polygon;
    }
    
    // Add position if present
    if (response.position && 
        typeof response.position === 'object' && 
        'latitude' in response.position && 
        'longitude' in response.position) {
      result.position = response.position as { latitude: number; longitude: number };
    }
    
    // Add area if present
    if (response.area && 
        typeof response.area === 'object' && 
        'value' in response.area && 
        'unit' in response.area) {
      result.area = response.area as { value: number; unit: 'acres' | 'square_feet' | 'square_meters' | 'hectares' };
    }
    
    // Add errors, warnings, and notes
    if (response.errors && Array.isArray(response.errors)) {
      result.errors = response.errors as string[];
    }
    
    if (response.warnings && Array.isArray(response.warnings)) {
      result.warnings = response.warnings as string[];
    }
    
    if (response.notes && Array.isArray(response.notes)) {
      result.notes = response.notes as string[];
    }
    
    return result;
  }
  
  /**
   * Batch analyze multiple legal descriptions
   */
  async batchAnalyze(
    descriptions: string[],
    options: AnalysisOptions = {}
  ): Promise<AnalyzedDescription[]> {
    // Start timing
    const startTime = Date.now();
    
    try {
      legalLogger.info(`Starting batch analysis of ${descriptions.length} legal descriptions`);
      
      // Process each description
      const results = await Promise.all(
        descriptions.map(description => this.analyze(description, options))
      );
      
      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;
      
      legalLogger.info(`Batch analysis complete, processed ${descriptions.length} descriptions`, {
        processingTimeMs,
        avgTimePerDescription: processingTimeMs / descriptions.length
      });
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      legalLogger.error(`Batch analysis failed: ${errorMessage}`, error);
      
      throw new Error(`Batch analysis failed: ${errorMessage}`);
    }
  }
  
  /**
   * Check if a legal description is valid
   */
  async isValid(
    description: string,
    options: AnalysisOptions = {}
  ): Promise<{
    valid: boolean;
    confidence: number;
    reasons?: string[];
  }> {
    try {
      // Analyze the description
      const analysis = await this.analyze(description, {
        ...options,
        validateDescription: true
      });
      
      // Check if format was detected
      const formatValid = analysis.format !== DescriptionFormat.UNKNOWN;
      
      // Check if there are any errors
      const hasErrors = analysis.metadata.errors && analysis.metadata.errors.length > 0;
      
      // Determine validity
      const valid = formatValid && !hasErrors && analysis.confidence > 0.7;
      
      // Collect reasons for invalidity
      let reasons: string[] = [];
      
      if (!formatValid) {
        reasons.push('Description format could not be determined');
      }
      
      if (hasErrors) {
        reasons = reasons.concat(analysis.metadata.errors!);
      }
      
      if (analysis.confidence <= 0.7) {
        reasons.push(`Low confidence in analysis (${analysis.confidence.toFixed(2)})`);
      }
      
      return {
        valid,
        confidence: analysis.confidence,
        reasons: reasons.length > 0 ? reasons : undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        valid: false,
        confidence: 0,
        reasons: [errorMessage]
      };
    }
  }
  
  /**
   * Convert the analyzed description to a normalized text representation
   */
  formatNormalizedDescription(analysis: AnalyzedDescription): string {
    let normalized = '';
    
    try {
      // Format based on the description type
      switch (analysis.format) {
        case DescriptionFormat.PLSS:
          normalized = this.formatPLSS(analysis.plss);
          break;
          
        case DescriptionFormat.LOT_BLOCK:
          normalized = this.formatLotBlock(analysis.lotBlock);
          break;
          
        case DescriptionFormat.METES_AND_BOUNDS:
          normalized = this.formatMetesAndBounds(analysis.metesBounds);
          break;
          
        case DescriptionFormat.TAX_PARCEL:
          normalized = this.formatTaxParcel(analysis.taxParcel);
          break;
          
        case DescriptionFormat.MIXED:
          // Combine multiple formats
          normalized = [
            analysis.plss ? this.formatPLSS(analysis.plss) : '',
            analysis.lotBlock ? this.formatLotBlock(analysis.lotBlock) : '',
            analysis.metesBounds ? this.formatMetesAndBounds(analysis.metesBounds) : '',
            analysis.taxParcel ? this.formatTaxParcel(analysis.taxParcel) : ''
          ].filter(Boolean).join(' ');
          break;
          
        default:
          // Use original normalized text
          normalized = analysis.normalizedText;
      }
      
      return normalized || analysis.normalizedText;
    } catch (error) {
      legalLogger.error('Failed to format normalized description', error);
      return analysis.normalizedText;
    }
  }
  
  /**
   * Format PLSS components into a standardized text
   */
  private formatPLSS(plss?: PLSSComponents): string {
    if (!plss) return '';
    
    const parts: string[] = [];
    
    // Add quarter sections and aliquot parts
    if (plss.aliquotParts && plss.aliquotParts.length > 0) {
      parts.push(plss.aliquotParts.join(' '));
    } else if (plss.quarterSection) {
      parts.push(plss.quarterSection);
    }
    
    // Add section
    if (plss.section) {
      parts.push(`SECTION ${plss.section}`);
    }
    
    // Add township
    if (plss.township) {
      parts.push(`TOWNSHIP ${plss.township.number}${plss.township.direction}`);
    }
    
    // Add range
    if (plss.range) {
      parts.push(`RANGE ${plss.range.number}${plss.range.direction}`);
    }
    
    // Add meridian
    if (plss.meridian) {
      parts.push(plss.meridian);
    }
    
    return parts.join(', ');
  }
  
  /**
   * Format lot/block components into a standardized text
   */
  private formatLotBlock(lotBlock?: LotBlockComponents): string {
    if (!lotBlock) return '';
    
    const parts: string[] = [];
    
    // Add lot
    if (lotBlock.lot) {
      parts.push(`LOT ${lotBlock.lot}`);
    }
    
    // Add block
    if (lotBlock.block) {
      parts.push(`BLOCK ${lotBlock.block}`);
    }
    
    // Add subdivision
    if (lotBlock.subdivision) {
      parts.push(`${lotBlock.subdivision} SUBDIVISION`);
    }
    
    // Add phase/unit
    if (lotBlock.phase) {
      parts.push(`PHASE ${lotBlock.phase}`);
    }
    
    if (lotBlock.unit) {
      parts.push(`UNIT ${lotBlock.unit}`);
    }
    
    // Add addition
    if (lotBlock.addition) {
      parts.push(`${lotBlock.addition} ADDITION`);
    }
    
    return parts.join(', ');
  }
  
  /**
   * Format metes and bounds segments into a standardized text
   */
  private formatMetesAndBounds(segments?: MetesBoundsSegment[]): string {
    if (!segments || segments.length === 0) return '';
    
    // Format each segment
    const formattedSegments = segments.map(segment => {
      let formatted = '';
      
      // Add direction and bearing
      if (segment.degrees !== undefined) {
        formatted += `${segment.direction} ${segment.degrees}°`;
        
        if (segment.minutes !== undefined) {
          formatted += ` ${segment.minutes}'`;
          
          if (segment.seconds !== undefined) {
            formatted += ` ${segment.seconds}"`;
          }
        }
      } else {
        formatted += segment.direction;
      }
      
      // Add distance
      formatted += ` ${segment.distance} ${segment.unit.toUpperCase()}`;
      
      // Add point description if available
      if (segment.point) {
        formatted += ` TO ${segment.point}`;
      }
      
      return formatted;
    });
    
    // Join segments with "THENCE" for proper metes and bounds format
    return formattedSegments.join('; THENCE ');
  }
  
  /**
   * Format tax parcel components into a standardized text
   */
  private formatTaxParcel(taxParcel?: TaxParcelComponents): string {
    if (!taxParcel) return '';
    
    let formatted = `TAX PARCEL NUMBER ${taxParcel.number}`;
    
    // Add county and state if available
    if (taxParcel.county) {
      formatted += `, ${taxParcel.county} COUNTY`;
      
      if (taxParcel.state) {
        formatted += `, ${taxParcel.state}`;
      }
    }
    
    // Add assessor ID if available
    if (taxParcel.assessorId) {
      formatted += `; ASSESSOR ID: ${taxParcel.assessorId}`;
    }
    
    return formatted;
  }
}