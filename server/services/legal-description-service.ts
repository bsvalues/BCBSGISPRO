/**
 * Legal Description Service
 * 
 * This service handles parsing and converting legal property descriptions
 * into GeoJSON features that can be displayed on a map.
 */

import { 
  LegalDescriptionType, 
  ConfidenceLevel, 
  parseLegalDescription, 
  parseMetesBounds, 
  detectDescriptionType
} from '@shared/legal-description-parser';
import { Feature } from 'geojson';

/**
 * Extended parsing result with additional metadata for the server
 */
export interface ServerParsingResult {
  type: LegalDescriptionType;
  confidence: ConfidenceLevel;
  feature?: Feature;
  errorMessage?: string;
  segments?: any[];
  referencePoint?: [number, number];
  rawText: string;
  processedAt: Date;
  processingTimeMs: number;
  userReference?: {
    parcelId?: string;
    coordinates?: [number, number];
  };
}

/**
 * Example legal description
 */
const EXAMPLE_DESCRIPTIONS = [
  {
    name: 'Simple Metes and Bounds',
    description: `Beginning at a point on the southerly line of Lot 2; thence N 89° 30' E, 200 feet; thence S 0° 30' W, 150 feet; thence S 89° 30' W, 200 feet; thence N 0° 30' E, 150 feet to the point of beginning.`,
    type: LegalDescriptionType.METES_AND_BOUNDS,
  },
  {
    name: 'Complex Metes and Bounds',
    description: `Commencing at the Northeast corner of said Lot 1; thence S 00°15'33" W along the East line of said Lot 1 a distance of 195.98 feet; thence N 89°39'15" W a distance of 120.68 feet; thence S 00°15'33" W a distance of 155.19 feet to the point of beginning; thence continuing S 00°15'33" W a distance of 137.00 feet; thence N 89°39'15" W a distance of 84.84 feet; thence N 00°15'33" E a distance of 137.00 feet; thence S 89°39'15" E a distance of 84.84 feet to the point of beginning.`,
    type: LegalDescriptionType.METES_AND_BOUNDS
  },
  {
    name: 'Section-Township-Range',
    description: `The Northwest quarter of the Northeast quarter of Section 15, Township 7 North, Range 3 East, Benton County, Washington.`,
    type: LegalDescriptionType.SECTION_TOWNSHIP_RANGE
  },
  {
    name: 'Lot and Block',
    description: `Lot 5, Block 3, SUNSET VISTA ADDITION, according to the plat thereof recorded in Volume 7 of Plats, Page 15, records of Benton County, Washington.`,
    type: LegalDescriptionType.LOT_BLOCK
  }
];

/**
 * Parse a legal description text
 */
export async function parseDescription(
  text: string, 
  referencePoint?: [number, number],
  parcelId?: string
): Promise<ServerParsingResult> {
  const startTime = process.hrtime();
  
  try {
    // Use shared parser to parse the legal description
    const result = parseLegalDescription(text, referencePoint);
    
    // Calculate processing time
    const hrEnd = process.hrtime(startTime);
    const processingTimeMs = hrEnd[0] * 1000 + hrEnd[1] / 1000000;
    
    // Add server-specific metadata
    const serverResult: ServerParsingResult = {
      ...result,
      processedAt: new Date(),
      processingTimeMs,
      userReference: parcelId ? { parcelId } : undefined,
    };
    
    return serverResult;
  } catch (error) {
    // Handle parsing errors
    const hrEnd = process.hrtime(startTime);
    const processingTimeMs = hrEnd[0] * 1000 + hrEnd[1] / 1000000;
    
    return {
      type: LegalDescriptionType.UNKNOWN,
      confidence: ConfidenceLevel.LOW,
      errorMessage: error instanceof Error ? error.message : String(error),
      rawText: text,
      processedAt: new Date(),
      processingTimeMs,
      userReference: parcelId ? { parcelId } : undefined,
      referencePoint
    };
  }
}

/**
 * Get example legal descriptions for testing and demonstration
 */
export function getExampleDescriptions(): { description: string, type: LegalDescriptionType, name: string }[] {
  return EXAMPLE_DESCRIPTIONS;
}

/**
 * Analyze a legal description and provide insights without fully parsing it
 */
export function analyzeLegalDescription(text: string): {
  type: LegalDescriptionType;
  confidence: ConfidenceLevel;
  keywords: string[];
  possiblePatterns: string[];
  suggestedReferencePoint?: boolean;
} {
  const type = detectDescriptionType(text);
  
  // Basic keyword extraction
  const keywords = extractKeywords(text);
  
  // Determine if a reference point might be needed
  const needsReferencePoint = type === LegalDescriptionType.METES_AND_BOUNDS;
  
  // Identify potential patterns in the text
  const possiblePatterns = identifyPatterns(text, type);
  
  // Assess confidence based on the detected type and patterns
  const confidence = assessConfidence(text, type, possiblePatterns);
  
  return {
    type,
    confidence,
    keywords,
    possiblePatterns,
    suggestedReferencePoint: needsReferencePoint
  };
}

/**
 * Extract key terminology from legal description
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Common terms in legal descriptions
  const terms = [
    'beginning', 'commencing', 'point of beginning', 'thence', 'feet',
    'north', 'south', 'east', 'west', 'section', 'township', 'range',
    'lot', 'block', 'subdivision', 'quarter', 'acres', 'degree',
    'minutes', 'seconds', 'bearings', 'distance'
  ];
  
  terms.forEach(term => {
    if (lowerText.includes(term)) {
      keywords.push(term);
    }
  });
  
  // Look for directional notation like "N 89° W"
  const directionalPattern = /[NSEW]\s*\d+[°'\s]*\d*['"\s]*\d*\s*[NSEW]/gi;
  const directionals = text.match(directionalPattern);
  if (directionals && directionals.length > 0) {
    keywords.push('directional bearings');
  }
  
  // Look for measurements
  const distancePattern = /\d+\s*(feet|foot|ft|\')|\d+\.\d+\s*(feet|foot|ft|\')/gi;
  const distances = text.match(distancePattern);
  if (distances && distances.length > 0) {
    keywords.push('distance measurements');
  }
  
  return Array.from(new Set(keywords)); // Remove duplicates
}

/**
 * Identify potential patterns in the legal description text
 */
function identifyPatterns(text: string, type: LegalDescriptionType): string[] {
  const patterns: string[] = [];
  
  if (type === LegalDescriptionType.METES_AND_BOUNDS) {
    // Check for starting point definition
    if (/beginning at|commencing at|point of beginning|POB/i.test(text)) {
      patterns.push('starting point definition');
    }
    
    // Check for direction and distance patterns
    const directionDistancePattern = /(north|south|east|west|N|S|E|W).*?(\d+\.?\d*).*?(feet|foot|ft)/gi;
    const directionDistanceMatches = text.match(directionDistancePattern);
    if (directionDistanceMatches && directionDistanceMatches.length > 0) {
      patterns.push('direction-distance pairs');
    }
    
    // Check for bearings
    const bearingPattern = /[NSEW]\s*\d+[°'\s]*\d*['"\s]*\d*\s*[NSEW]/gi;
    const bearingMatches = text.match(bearingPattern);
    if (bearingMatches && bearingMatches.length > 0) {
      patterns.push('bearings');
    }
    
    // Check for closed loop (ending at starting point)
    if (/to the point of beginning|to the place of beginning|to the POB/i.test(text)) {
      patterns.push('closed loop');
    }
  } else if (type === LegalDescriptionType.SECTION_TOWNSHIP_RANGE) {
    // Check for township and range notation
    if (/township\s+\d+\s+(north|south)|T\d+[NS]/i.test(text) && 
        /range\s+\d+\s+(east|west)|R\d+[EW]/i.test(text)) {
      patterns.push('township-range notation');
    }
    
    // Check for section notation
    if (/section\s+\d+|sec\.\s*\d+/i.test(text)) {
      patterns.push('section notation');
    }
    
    // Check for aliquot parts (divisions of a section)
    if (/quarter|½|1\/4|NW|NE|SW|SE/i.test(text)) {
      patterns.push('aliquot parts');
    }
  } else if (type === LegalDescriptionType.LOT_BLOCK) {
    // Check for lot and block notation
    if (/lot\s+\d+/i.test(text) && /block\s+\d+/i.test(text)) {
      patterns.push('lot-block notation');
    }
    
    // Check for subdivision reference
    if (/subdivision|addition|plat|according to|recorded|volume|page|records of/i.test(text)) {
      patterns.push('subdivision reference');
    }
  }
  
  return patterns;
}

/**
 * Assess confidence level based on detected patterns
 */
function assessConfidence(text: string, type: LegalDescriptionType, patterns: string[]): ConfidenceLevel {
  // Default to LOW confidence
  let confidence = ConfidenceLevel.LOW;
  
  // Adjust confidence based on pattern count and type
  if (patterns.length >= 3) {
    confidence = ConfidenceLevel.HIGH;
  } else if (patterns.length >= 1) {
    confidence = ConfidenceLevel.MEDIUM;
  }
  
  // Special case checks to adjust confidence
  if (type === LegalDescriptionType.METES_AND_BOUNDS) {
    // Metes and bounds should have a starting point and directions
    const hasStartingPoint = patterns.includes('starting point definition');
    const hasDirections = patterns.includes('direction-distance pairs') || patterns.includes('bearings');
    const hasClosedLoop = patterns.includes('closed loop');
    
    if (hasStartingPoint && hasDirections && hasClosedLoop) {
      confidence = ConfidenceLevel.HIGH;
    } else if (!hasStartingPoint || !hasDirections) {
      confidence = ConfidenceLevel.LOW;
    }
  } else if (type === LegalDescriptionType.SECTION_TOWNSHIP_RANGE) {
    // Section-township-range should have all three components
    const hasTownship = /township\s+\d+\s+(north|south)|T\d+[NS]/i.test(text);
    const hasRange = /range\s+\d+\s+(east|west)|R\d+[EW]/i.test(text);
    const hasSection = /section\s+\d+|sec\.\s*\d+/i.test(text);
    
    if (hasTownship && hasRange && hasSection) {
      confidence = ConfidenceLevel.HIGH;
    } else if (!hasTownship || !hasRange || !hasSection) {
      confidence = ConfidenceLevel.LOW;
    }
  } else if (type === LegalDescriptionType.LOT_BLOCK) {
    // Lot-block should have both components and subdivision reference
    const hasLot = /lot\s+\d+/i.test(text);
    const hasBlock = /block\s+\d+/i.test(text);
    const hasSubdivision = /subdivision|addition|plat/i.test(text);
    
    if (hasLot && hasBlock && hasSubdivision) {
      confidence = ConfidenceLevel.HIGH;
    } else if (!hasLot || !hasBlock) {
      confidence = ConfidenceLevel.LOW;
    }
  }
  
  return confidence;
}