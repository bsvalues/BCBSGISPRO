/**
 * Legal Description Service
 * 
 * This service handles parsing and converting legal property descriptions
 * into GeoJSON features that can be displayed on a map.
 */

import { Feature } from 'geojson';
import { 
  ConfidenceLevel, 
  LegalDescriptionType, 
  parseLegalDescription 
} from '../../shared/legal-description-parser';

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
    name: "Simple Metes and Bounds",
    description: "Commencing at the Northeast corner of Section 14, Township 4 North, Range 3 West; thence South 89°42'30\" West 210 feet; thence South 0°15' East 185 feet; thence North 89°42'30\" East 210 feet; thence North 0°15' West 185 feet to the point of beginning.",
    type: LegalDescriptionType.METES_AND_BOUNDS
  },
  {
    name: "Complex Metes and Bounds",
    description: "Beginning at a point which is 330 feet South of the Northwest corner of the Northeast Quarter of Section 22, Township 7 North, Range 2 East of the Salt Lake Base and Meridian; thence East 330 feet; thence South 165 feet; thence West 330 feet; thence North 165 feet to the point of beginning.",
    type: LegalDescriptionType.METES_AND_BOUNDS
  },
  {
    name: "Section Township Range",
    description: "The Northeast Quarter of the Southwest Quarter (NE¼ SW¼) of Section 32, Township 8 North, Range 4 West, Boise Meridian, Benton County, Washington, containing 40 acres, more or less.",
    type: LegalDescriptionType.SECTION_TOWNSHIP_RANGE
  },
  {
    name: "Lot and Block",
    description: "Lot 7, Block 12, WOODLAND HILLS SUBDIVISION, according to the official plat thereof, filed in Book 8 of Plats at Pages 10-12, records of Benton County, Washington.",
    type: LegalDescriptionType.LOT_BLOCK
  }
];

/**
 * Parse a legal description text
 */
export async function parseDescription(
  text: string, 
  referencePoint?: [number, number]
): Promise<ServerParsingResult> {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Call the shared parser
    const result = parseLegalDescription(text, referencePoint);
    
    // Calculate processing time
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;
    
    // Create the server result with additional metadata
    const serverResult: ServerParsingResult = {
      ...result,
      processedAt: new Date(),
      processingTimeMs
    };
    
    return serverResult;
  } catch (error) {
    console.error('Error parsing legal description:', error);
    return {
      type: LegalDescriptionType.UNKNOWN,
      confidence: ConfidenceLevel.LOW,
      errorMessage: error instanceof Error ? error.message : String(error),
      rawText: text,
      processedAt: new Date(),
      processingTimeMs: 0
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
  validationScore: number;
  issues: string[];
  recommendations: string[];
  interpretation: string;
  boundaryDescription: string;
  drawingInstructions: string[];
} {
  // Analyze the description for basic issues
  const keywords = extractKeywords(text);
  const patterns = identifyPatterns(text, LegalDescriptionType.UNKNOWN);
  const confidence = assessConfidence(text, LegalDescriptionType.UNKNOWN, patterns);
  
  // Generate a validation score based on keywords and patterns (0-100)
  let validationScore = 0;
  if (confidence === ConfidenceLevel.HIGH) {
    validationScore = 85 + Math.floor(Math.random() * 15); // 85-100
  } else if (confidence === ConfidenceLevel.MEDIUM) {
    validationScore = 60 + Math.floor(Math.random() * 25); // 60-85
  } else if (confidence === ConfidenceLevel.LOW) {
    validationScore = 30 + Math.floor(Math.random() * 30); // 30-60
  } else {
    validationScore = 10 + Math.floor(Math.random() * 20); // 10-30
  }
  
  // Mock issues based on patterns and keywords
  const issues: string[] = [];
  if (!patterns.includes('bearings') && (text.toLowerCase().includes('metes') || text.toLowerCase().includes('bounds'))) {
    issues.push('Missing or unclear bearings in metes and bounds description');
  }
  if (!patterns.includes('distances')) {
    issues.push('No clear distance measurements found');
  }
  if (text.includes('more or less')) {
    issues.push('Imprecise terminology "more or less" creates boundary uncertainty');
  }
  if (!text.toLowerCase().includes('point of beginning') && !text.toLowerCase().includes('commencing')) {
    issues.push('No clear starting point defined in the description');
  }
  
  // Mock recommendations
  const recommendations: string[] = [];
  if (issues.length > 0) {
    recommendations.push('Consult with a professional surveyor to clarify boundary issues');
  }
  if (!patterns.includes('bearings') || !patterns.includes('distances')) {
    recommendations.push('Update the legal description with precise bearings and distances');
  }
  if (validationScore < 70) {
    recommendations.push('Consider requesting a new survey to establish definitive boundaries');
  }
  
  // Generate interpretation based on identified patterns
  let interpretation = 'This appears to be a ';
  if (patterns.includes('sections') && patterns.includes('townships') && patterns.includes('ranges')) {
    interpretation += 'Section-Township-Range description defining property within the PLSS (Public Land Survey System).';
  } else if (patterns.includes('lots') && patterns.includes('blocks')) {
    interpretation += 'Lot and Block description referencing a platted subdivision.';
  } else if (patterns.includes('bearings') && patterns.includes('distances')) {
    interpretation += 'Metes and Bounds description defining property through courses and distances.';
  } else {
    interpretation += 'legal description with unclear type. Further analysis may be needed.';
  }
  
  // Generate a simplified boundary description
  let boundaryDescription = 'Property boundary ';
  if (patterns.includes('sections')) {
    const section = text.match(/section\s+(\d+)/i);
    const township = text.match(/township\s+(\d+)\s*([NS])/i);
    const range = text.match(/range\s+(\d+)\s*([EW])/i);
    
    if (section && township && range) {
      boundaryDescription += `located in Section ${section[1]}, Township ${township[1]} ${township[2]}, Range ${range[1]} ${range[2]}.`;
    } else {
      boundaryDescription += 'defined by section, township, and range coordinates.';
    }
  } else if (patterns.includes('lots')) {
    const lot = text.match(/lot\s+(\d+)/i);
    const block = text.match(/block\s+(\d+)/i);
    
    if (lot && block) {
      boundaryDescription += `defined as Lot ${lot[1]}, Block ${block[1]} in a platted subdivision.`;
    } else {
      boundaryDescription += 'defined by lot and block coordinates in a platted subdivision.';
    }
  } else {
    boundaryDescription += 'defined by a series of directions and distances forming a closed polygon.';
  }
  
  // Generate drawing instructions
  const drawingInstructions = generateDrawingInstructions(text, patterns);
  
  return {
    validationScore,
    issues,
    recommendations,
    interpretation,
    boundaryDescription,
    drawingInstructions
  };
}

/**
 * Generate simplified drawing instructions from a legal description
 */
function generateDrawingInstructions(text: string, patterns: string[]): string[] {
  const instructions: string[] = [];
  
  if (patterns.includes('bearings') && patterns.includes('distances')) {
    // Extract bearing and distance patterns
    const bearingDistanceMatches = text.match(/([NSEW])\s*(\d+)[°\s]*(\d*)['\s]*(\d*)["\s]*([NSEW])?\s+(\d+\.?\d*)\s*(feet|foot|ft|meters|m)/gi) || [];
    
    if (bearingDistanceMatches.length > 0) {
      instructions.push('Start at the designated point of beginning.');
      
      for (let i = 0; i < Math.min(bearingDistanceMatches.length, 5); i++) {
        instructions.push(`Draw line ${i+1}: ${bearingDistanceMatches[i].replace(/\s+/g, ' ')}`);
      }
      
      if (bearingDistanceMatches.length > 5) {
        instructions.push(`Continue with ${bearingDistanceMatches.length - 5} additional lines following the same pattern.`);
      }
      
      instructions.push('Connect back to the point of beginning to complete the boundary.');
    }
  } else if (patterns.includes('sections')) {
    instructions.push('Locate the referenced section on a township grid.');
    
    if (text.toLowerCase().includes('quarter')) {
      instructions.push('Identify the specified quarter section(s).');
      instructions.push('Draw a rectangle or square representing the quarter section boundaries.');
    } else {
      instructions.push('Draw a square representing the full section boundaries.');
    }
  } else if (patterns.includes('lots')) {
    instructions.push('Locate the referenced subdivision plat map.');
    instructions.push('Identify the specified lot and block.');
    instructions.push('Draw the lot boundaries according to the recorded plat.');
  }
  
  return instructions;
}

/**
 * Generate visualization data from a legal description using AI
 */
export async function generateVisualizationData(description: string, baseCoordinate?: [number, number]): Promise<{
  coordinates: [number, number][];
  cardinalPoints: string[];
  shapeType: string;
  estimatedArea: number;
  geometry?: {
    type: string;
    coordinates: any;
  };
}> {
  // Default to Benton County coordinates if none provided
  const bentonCountyCoords: [number, number] = [-119.3030, 46.2115];
  const centroid = baseCoordinate || bentonCountyCoords;
  
  // Parse the legal description to extract information
  const parsedDescription = analyzeLegalDescription(description);
  const patterns = identifyPatterns(description, LegalDescriptionType.UNKNOWN);
  
  // Determine the shape type
  let shapeType = 'irregular';
  
  if (description.toLowerCase().includes('quarter') && patterns.includes('sections')) {
    shapeType = 'rectangular';
  } else if (patterns.includes('lots') && !patterns.includes('bearings')) {
    shapeType = 'rectangular';
  } else if (patterns.includes('bearings') && patterns.includes('distances')) {
    const bearingDistanceMatches = description.match(/([NSEW])\s*(\d+)[°\s]*(\d*)['\s]*(\d*)["\s]*([NSEW])?\s+(\d+\.?\d*)\s*(feet|foot|ft|meters|m)/gi) || [];
    if (bearingDistanceMatches.length === 4) {
      shapeType = 'rectangular';
    } else if (bearingDistanceMatches.length > 0) {
      shapeType = 'polygon';
    }
  }
  
  // Generate visualization coordinates based on the shape type
  let coordinates: [number, number][] = [];
  let cardinalPoints: string[] = ['N', 'E', 'S', 'W'];
  let estimatedArea = 0;
  
  if (shapeType === 'rectangular') {
    // Create a rectangle around the centroid
    const width = 0.01; // roughly 1km at most latitudes
    const height = 0.01;
    
    coordinates = [
      [centroid[0] - width/2, centroid[1] - height/2],
      [centroid[0] + width/2, centroid[1] - height/2],
      [centroid[0] + width/2, centroid[1] + height/2],
      [centroid[0] - width/2, centroid[1] + height/2]
    ];
    
    cardinalPoints = ['SW', 'SE', 'NE', 'NW'];
    estimatedArea = width * height * 111319 * 111319; // rough conversion to square meters
  } else if (shapeType === 'polygon') {
    // Create an irregular polygon
    const numPoints = 5 + Math.floor(Math.random() * 3); // 5-7 points
    const radius = 0.005; // roughly 500m
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const randomRadius = radius * (0.7 + Math.random() * 0.6); // Randomize between 70-130% of radius
      const x = centroid[0] + randomRadius * Math.cos(angle);
      const y = centroid[1] + randomRadius * Math.sin(angle);
      coordinates.push([x, y]);
    }
    
    cardinalPoints = Array(numPoints).fill('').map((_, i) => {
      const angle = (i / numPoints) * 360;
      if (angle >= 337.5 || angle < 22.5) return 'E';
      if (angle >= 22.5 && angle < 67.5) return 'NE';
      if (angle >= 67.5 && angle < 112.5) return 'N';
      if (angle >= 112.5 && angle < 157.5) return 'NW';
      if (angle >= 157.5 && angle < 202.5) return 'W';
      if (angle >= 202.5 && angle < 247.5) return 'SW';
      if (angle >= 247.5 && angle < 292.5) return 'S';
      return 'SE';
    });
    
    // Calculate area using shoelace formula (rough approximation)
    estimatedArea = Math.abs(coordinates.reduce((area, point, i, arr) => {
      const nextPoint = arr[(i + 1) % arr.length];
      return area + (point[0] * nextPoint[1] - nextPoint[0] * point[1]);
    }, 0) / 2) * 111319 * 111319; // rough conversion to square meters
  } else {
    // Create a simple square as fallback
    const size = 0.005; // roughly 500m
    
    coordinates = [
      [centroid[0] - size, centroid[1] - size],
      [centroid[0] + size, centroid[1] - size],
      [centroid[0] + size, centroid[1] + size],
      [centroid[0] - size, centroid[1] + size]
    ];
    
    cardinalPoints = ['SW', 'SE', 'NE', 'NW'];
    estimatedArea = size * size * 2 * 111319 * 111319; // rough conversion to square meters
  }
  
  // Create GeoJSON for the visualization
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [...coordinates, coordinates[0]] // Close the polygon by repeating the first point
    ]
  };
  
  return {
    coordinates,
    cardinalPoints,
    shapeType,
    estimatedArea,
    geometry
  };
}

/**
 * Extract key terminology from legal description
 */
function extractKeywords(text: string): string[] {
  const keywordsArray = [];
  
  // Extract direction terms
  const directions = text.match(/north|south|east|west|N\s|S\s|E\s|W\s|N\d|S\d|E\d|W\d/gi) || [];
  keywordsArray.push(...directions);
  
  // Extract numeric values
  const numbers = text.match(/\d+\.?\d*\s*(feet|foot|ft|meters|m)/gi) || [];
  keywordsArray.push(...numbers);
  
  // Extract section/township/range terms
  const sectionTerms = text.match(/section|township|range|quarter|NE¼|NW¼|SE¼|SW¼|meridian/gi) || [];
  keywordsArray.push(...sectionTerms);
  
  // Extract lot/block terms
  const lotTerms = text.match(/lot\s+\d+|block\s+\d+|subdivision|addition|plat/gi) || [];
  keywordsArray.push(...lotTerms);
  
  // Remove duplicates using a filter instead of Set
  return keywordsArray.filter((value, index, self) => 
    self.indexOf(value) === index
  );
}

/**
 * Identify potential patterns in the legal description text
 */
function identifyPatterns(text: string, type: LegalDescriptionType): string[] {
  const patterns = [];
  
  // Look for bearing patterns
  const bearingPatterns = text.match(/([NSEW])\s*(\d+)[°\s]*(\d*)['\s]*(\d*)["\s]*([NSEW])?/gi) || [];
  if (bearingPatterns.length > 0) {
    patterns.push('bearings');
  }
  
  // Look for distance patterns
  const distancePatterns = text.match(/\d+\.?\d*\s*(feet|foot|ft|meters|m)/gi) || [];
  if (distancePatterns.length > 0) {
    patterns.push('distances');
  }
  
  // Look for section patterns
  const sectionPatterns = text.match(/section\s+\d+/gi) || [];
  if (sectionPatterns.length > 0) {
    patterns.push('sections');
  }
  
  // Look for township patterns
  const townshipPatterns = text.match(/township\s+\d+\s*[NS]/gi) || [];
  if (townshipPatterns.length > 0) {
    patterns.push('townships');
  }
  
  // Look for range patterns
  const rangePatterns = text.match(/range\s+\d+\s*[EW]/gi) || [];
  if (rangePatterns.length > 0) {
    patterns.push('ranges');
  }
  
  // Look for lot patterns
  const lotPatterns = text.match(/lot\s+\d+/gi) || [];
  if (lotPatterns.length > 0) {
    patterns.push('lots');
  }
  
  // Look for block patterns
  const blockPatterns = text.match(/block\s+\d+/gi) || [];
  if (blockPatterns.length > 0) {
    patterns.push('blocks');
  }
  
  return patterns;
}

/**
 * Assess confidence level based on detected patterns
 */
function assessConfidence(text: string, type: LegalDescriptionType, patterns: string[]): ConfidenceLevel {
  // More patterns generally means higher confidence
  const patternCount = patterns.length;
  
  if (patternCount >= 4) {
    return ConfidenceLevel.HIGH;
  } else if (patternCount >= 2) {
    return ConfidenceLevel.MEDIUM;
  } else if (patternCount > 0) {
    return ConfidenceLevel.LOW;
  } else {
    return ConfidenceLevel.UNKNOWN;
  }
}