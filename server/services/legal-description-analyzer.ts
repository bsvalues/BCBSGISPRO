/**
 * Legal Description Analyzer Service
 * Specialized for analyzing Benton County parcel descriptions and boundaries.
 * Incorporates both OpenAI and Anthropic for enhanced reliability and accuracy,
 * with automatic failover between services.
 */

import { logger } from '../logger';
import OpenAI from 'openai';
import { legalDescriptionService } from './anthropic-service';
import { 
  ParsedLegalDescription,
  LegalDescriptionResult,
  LegalDescriptionVisualization 
} from '../../shared/schema';

// Create OpenAI client instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback to use when OpenAI API is not available
const FAIRGROUND_PARCELS = [
  {
    id: "parcel-1",
    name: "Parcel 1",
    description: "That portion of the West Half of the Northwest Quarter of Section 8, Township 8 North, Range 30 East, of the Willamette Meridian...",
    acreage: 26.60,
    coordinates: [
      { lat: 46.2210, lng: -119.2105 },
      { lat: 46.2245, lng: -119.2105 },
      { lat: 46.2245, lng: -119.2040 },
      { lat: 46.2210, lng: -119.2040 },
    ],
    boundaryPoints: [
      { direction: "S0°31'06\"E", distance: "40.00 feet" },
      { direction: "S0°31'06\"E", distance: "1355.07 feet" },
      { direction: "N87°43'01\"E", distance: "112.37 feet" },
      { direction: "N54°29'41\"E", distance: "211.80 feet" },
      { direction: "N75°22'25\"E", distance: "604.15 feet" },
      { direction: "N87°43'01\"E", distance: "433.66 feet" },
      { direction: "N0°31'06\"W", distance: "1127.65 feet" },
      { direction: "S89°47'01\"W", distance: "1323.51 feet" }
    ]
  },
  {
    id: "parcel-2",
    name: "Parcel 2",
    description: "That portion of the West Half of the Northwest Quarter of Section 8, Township 8 North, Range 30 East, of the Willamette Meridian...",
    acreage: 28.22,
    coordinates: [
      { lat: 46.2175, lng: -119.2105 },
      { lat: 46.2210, lng: -119.2105 },
      { lat: 46.2210, lng: -119.2040 },
      { lat: 46.2175, lng: -119.2040 },
    ],
    boundaryPoints: [
      { direction: "S0°31'06\"E", distance: "40.00 feet" },
      { direction: "S0°31'06\"E", distance: "1355.07 feet" },
      { direction: "S0°31'06\"E", distance: "596.46 feet" },
      { direction: "N87°43'01\"E", distance: "1323.12 feet" },
      { direction: "N0°28'38\"W", distance: "601.60 feet" },
      { direction: "S87°43'01\"W", distance: "433.66 feet" },
      { direction: "S75°22'25\"W", distance: "604.15 feet" },
      { direction: "S54°29'41\"W", distance: "211.80 feet" },
      { direction: "S87°43'01\"W", distance: "112.37 feet" }
    ]
  },
  {
    id: "parcel-3",
    name: "Parcel 3",
    description: "That portion of the West Half of the Northwest Quarter of Section 8, Township 8 North, Range 30 East, of the Willamette Meridian...",
    acreage: 7.07,
    coordinates: [
      { lat: 46.2155, lng: -119.2080 },
      { lat: 46.2175, lng: -119.2080 },
      { lat: 46.2175, lng: -119.2040 },
      { lat: 46.2155, lng: -119.2040 },
    ],
    boundaryPoints: [
      { direction: "S0°31'06\"E", distance: "40.00 feet" },
      { direction: "S0°31'06\"E", distance: "1951.53 feet" },
      { direction: "S31°16'26\"E", distance: "76.70 feet" },
      { direction: "S59°18'48\"E", distance: "270.18 feet" },
      { direction: "N85°55'21\"E", distance: "405.31 feet" },
      { direction: "N0°28'38\"W", distance: "224.72 feet" },
      { direction: "S87°43'01\"W", distance: "655.89 feet" }
    ]
  },
  {
    id: "parcel-4",
    name: "Parcel 4",
    description: "That portion of the West Half of the Northwest Quarter of Section 8, Township 8 North, Range 30 East, of the Willamette Meridian...",
    acreage: 4.38,
    coordinates: [
      { lat: 46.2140, lng: -119.2060 },
      { lat: 46.2155, lng: -119.2060 },
      { lat: 46.2155, lng: -119.2040 },
      { lat: 46.2140, lng: -119.2040 },
    ],
    boundaryPoints: [
      { direction: "S0°31'06\"E", distance: "40.00 feet" },
      { direction: "S0°31'06\"E", distance: "1951.53 feet" },
      { direction: "S31°16'26\"E", distance: "76.70 feet" },
      { direction: "S59°18'48\"E", distance: "270.18 feet" },
      { direction: "S85°55'21\"W", distance: "405.31 feet" },
      { direction: "S0°28'38\"E", distance: "224.72 feet" },
      { direction: "N85°57'21\"E", distance: "383.85 feet" },
      { direction: "N0°28'38\"W", distance: "386.80 feet" },
      { direction: "S87°43'01\"W", distance: "289.23 feet" }
    ]
  },
  {
    id: "parcel-5",
    name: "Parcel 5",
    description: "That portion of the West Half of the Northwest Quarter of Section 8, Township 8 North, Range 30 East, of the Willamette Meridian...",
    acreage: 1.45,
    coordinates: [
      { lat: 46.2135, lng: -119.2040 },
      { lat: 46.2140, lng: -119.2040 },
      { lat: 46.2140, lng: -119.2025 },
      { lat: 46.2135, lng: -119.2025 },
    ],
    boundaryPoints: [
      { direction: "S0°31'06\"E", distance: "40.00 feet" },
      { direction: "S0°31'06\"E", distance: "1951.53 feet" },
      { direction: "S31°16'26\"E", distance: "76.70 feet" },
      { direction: "S59°18'48\"E", distance: "270.18 feet" },
      { direction: "S85°55'21\"W", distance: "405.31 feet" },
      { direction: "S0°28'38\"E", distance: "224.72 feet" },
      { direction: "N85°57'21\"E", distance: "383.85 feet" },
      { direction: "N0°28'38\"W", distance: "386.80 feet" },
      { direction: "N87°43'01\"E", distance: "178.00 feet" },
      { direction: "S4°22'33\"E", distance: "386.30 feet" },
      { direction: "S87°43'01\"W", distance: "218.00 feet" }
    ]
  }
];

/**
 * Parse a legal description and extract key components like bearings and distances.
 * Uses both OpenAI and Anthropic services with failover capability.
 * 
 * @param description The legal description text to parse
 * @returns Structured data about the legal description
 */
export async function parseLegalDescription(description: string): Promise<ParsedLegalDescription> {
  if (!description) {
    logger.error('No legal description provided');
    throw new Error('Legal description text is required');
  }

  try {
    logger.info(`Parsing legal description: ${description.substring(0, 50)}...`);
    
    // First, try to use Anthropic for parsing
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        logger.info('Attempting to parse with Anthropic Claude');
        const result = await legalDescriptionService.parseLegalDescription(description);
        logger.info('Successfully parsed legal description with Anthropic Claude');
        return {
          ...result,
          parseMethod: 'anthropic-claude'
        };
      }
    } catch (error: any) {
      logger.warn(`Error using Anthropic for legal description parsing: ${error.message}`);
    }
    
    // If Anthropic fails, try OpenAI as backup
    try {
      if (process.env.OPENAI_API_KEY) {
        logger.info('Attempting to parse with OpenAI GPT-4o');
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a specialized AI for analyzing legal property descriptions in Benton County, Washington.
              Extract structural information from the legal description, including section/township/range data, 
              cardinal bearings, and boundary measurements. Return JSON with the following structure:
              {
                "section": string,
                "township": string,
                "range": string,
                "plat": string,
                "lot": string,
                "block": string,
                "subdivision": string,
                "boundaryPoints": string[],
                "acreage": string,
                "quarterSections": string[]
              }`
            },
            {
              role: "user",
              content: description
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        const openaiResult = JSON.parse(response.choices[0].message.content);
        logger.info('Successfully parsed legal description with OpenAI GPT-4o');
        
        return {
          section: openaiResult.section,
          township: openaiResult.township,
          range: openaiResult.range,
          plat: openaiResult.plat,
          lot: openaiResult.lot,
          block: openaiResult.block,
          subdivision: openaiResult.subdivision,
          boundaryPoints: openaiResult.boundaryPoints || [],
          acreage: openaiResult.acreage,
          quarterSections: openaiResult.quarterSections || [],
          rawDescription: description,
          parseMethod: 'openai-gpt4o'
        };
      }
    } catch (error: any) {
      logger.warn(`Error using OpenAI for legal description parsing: ${error.message}`);
    }
    
    // If both AI services fail, use our basic regex parsing as last resort
    logger.info('Using basic regex parsing as fallback');
    const section = description.match(/Section\s+(\d+)/i)?.[1] || "";
    const township = description.match(/Township\s+(\d+)\s+North/i)?.[1] || "";
    const range = description.match(/Range\s+(\d+)\s+East/i)?.[1] || "";
    const plat = description.match(/Plat\s+of\s+([^,\.]+)/i)?.[1] || "";
    const lot = description.match(/Lot\s+(\d+)/i)?.[1] || "";
    const block = description.match(/Block\s+(\d+)/i)?.[1] || "";
    
    // Extract bearings and distances
    const bearingPattern = /(N|S)\s*(\d+)°(\d+)'(\d+)"\s*(E|W)/g;
    const distancePattern = /(\d+\.\d+)\s+feet/g;
    
    const boundaryPoints: string[] = [];
    
    let match;
    while ((match = bearingPattern.exec(description)) !== null) {
      boundaryPoints.push(match[0]);
    }
    
    // Find quarter sections (e.g., "NE 1/4")
    const quarterPattern = /(N[EW]|S[EW])\s+1\/4/g;
    const quarterSections: string[] = [];
    
    while ((match = quarterPattern.exec(description)) !== null) {
      quarterSections.push(match[0]);
    }
    
    return {
      section,
      township,
      range,
      plat,
      lot,
      block,
      subdivision: "",
      boundaryPoints,
      acreage: description.match(/(\d+\.\d+)\s+acres/i)?.[1] || "",
      quarterSections,
      rawDescription: description,
      parseMethod: 'basic-regex'
    };
  } catch (error: any) {
    logger.error('Error parsing legal description:', error);
    throw new Error(`Failed to parse legal description: ${error.message}`);
  }
}

/**
 * Visualize a legal description by creating a graphical representation.
 * Uses both Anthropic and OpenAI with failover for enhanced visualization quality.
 * 
 * @param description The legal description text to visualize
 * @returns Visualization data suitable for a map display
 */
export async function visualizeLegalDescription(description: string): Promise<LegalDescriptionVisualization> {
  if (!description) {
    logger.error('No legal description provided');
    throw new Error('Legal description text is required');
  }

  try {
    logger.info(`Visualizing legal description: ${description.substring(0, 50)}...`);
    
    // First look for a matching parcel in our static data (highest precedence for known parcels)
    const foundParcel = FAIRGROUND_PARCELS.find(p => 
      description.includes(p.name) || (description.length > 20 && p.description.startsWith(description.substring(0, 20)))
    );
    
    if (foundParcel) {
      logger.info(`Found matching predefined parcel: ${foundParcel.name}`);
      
      // Convert from our internal format to the expected LegalDescriptionVisualization format
      const cardinalPoints = foundParcel.boundaryPoints.map(bp => 
        `${bp.direction} for ${bp.distance}`
      );
      
      // Convert our lat/lng format to the expected coordinates format
      const coordinates: [number, number][] = foundParcel.coordinates.map(coord => 
        [coord.lng, coord.lat]
      );
      
      return {
        coordinates,
        cardinalPoints,
        shapeType: "polygon",
        estimatedArea: foundParcel.acreage, 
        source: "predefined",
        parcelName: foundParcel.name,
        parcelId: foundParcel.id
      };
    }
    
    // Try to use Anthropic for visualization if available (more detailed visualization)
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        logger.info('Attempting to visualize with Anthropic Claude');
        const baseCoordinate: [number, number] = [-119.2100, 46.2200]; // Center of Benton County
        const result = await legalDescriptionService.generateVisualizationData(description, baseCoordinate);
        
        logger.info('Successfully generated visualization data with Anthropic Claude');
        
        return {
          ...result,
          source: 'anthropic-claude',
          parcelName: "Benton County Parcel"
        };
      }
    } catch (error: any) {
      logger.warn(`Error using Anthropic for visualization: ${error.message}`);
    }
    
    // Try to use OpenAI for visualization if Anthropic fails or is unavailable
    try {
      if (process.env.OPENAI_API_KEY) {
        logger.info('Attempting to visualize with OpenAI GPT-4o');
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a specialized AI for analyzing legal property descriptions in Benton County, Washington.
              Generate a visualization structure for the property boundaries described. You are 
              an expert in the Public Land Survey System (PLSS) used in Benton County.
              Focus especially on township, range, section, and quarter-section information.`
            },
            {
              role: "user",
              content: `Please create a visualization data for this property description:
              
              ${description}
              
              Generate a JSON object with these fields:
              - coordinates: Array of coordinate pairs [lng, lat] representing the polygon corners
              - cardinalPoints: Array of cardinal direction measurements in plain English
              - shapeType: Type of shape (polygon, rectangle, etc.)
              - estimatedArea: Estimated area in acres (number)
              
              Use approximately [-119.2100, 46.2200] as a reference coordinate in Benton County if needed.`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        const openaiResult = JSON.parse(response.choices[0].message.content);
        logger.info('Successfully generated visualization data with OpenAI GPT-4o');
        
        return {
          coordinates: openaiResult.coordinates || [[-119.2100, 46.2200], [-119.2050, 46.2200], [-119.2050, 46.2220], [-119.2100, 46.2220]],
          cardinalPoints: openaiResult.cardinalPoints || [],
          shapeType: openaiResult.shapeType || "polygon",
          estimatedArea: openaiResult.estimatedArea || 0,
          source: "openai-gpt4o",
          parcelName: "Benton County Parcel"
        };
      }
    } catch (error: any) {
      logger.warn(`Error using OpenAI for visualization: ${error.message}`);
    }
    
    // If both AI services fail, generate a generic visualization as a last resort
    logger.info('Using generic visualization as fallback');
    
    // Extract any acreage information we can find with regex
    const acreageMatch = description.match(/(\d+\.\d+)\s+acres/i);
    const estimatedArea = acreageMatch ? parseFloat(acreageMatch[1]) : 1.0;
    
    // Create a small generic polygon in Benton County
    return {
      coordinates: [
        [-119.2100, 46.2200],
        [-119.2050, 46.2200],
        [-119.2050, 46.2220],
        [-119.2100, 46.2220]
      ],
      cardinalPoints: [
        "North for 1320 feet",
        "East for 1320 feet",
        "South for 1320 feet",
        "West for 1320 feet"
      ],
      shapeType: "rectangle",
      estimatedArea,
      source: "generic-fallback",
      parcelName: "Unknown Parcel",
      parcelId: "generic-parcel"
    };
  } catch (error: any) {
    logger.error('Error visualizing legal description:', error);
    throw new Error(`Failed to visualize legal description: ${error.message}`);
  }
}

/**
 * Validate a legal description for completeness and correctness
 */
export async function validateLegalDescription(description: string): Promise<LegalDescriptionResult> {
  if (!description) {
    logger.error('No legal description provided');
    throw new Error('Legal description text is required');
  }

  try {
    logger.info(`Validating legal description: ${description.substring(0, 50)}...`);
    
    // First, try to use Anthropic for validation (more detailed recommendations)
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        logger.info('Attempting to validate with Anthropic Claude');
        const result = await legalDescriptionService.analyzeLegalDescription(description);
        
        logger.info('Successfully validated legal description with Anthropic Claude');
        return {
          ...result,
          validationMethod: 'anthropic-claude'
        };
      }
    } catch (error: any) {
      logger.warn(`Error using Anthropic for legal description validation: ${error.message}`);
    }
    
    // If Anthropic fails, try OpenAI as backup
    try {
      if (process.env.OPENAI_API_KEY) {
        logger.info('Attempting to validate with OpenAI GPT-4o');
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a specialized AI for analyzing legal property descriptions in Benton County, Washington. 
              Validate the legal description for completeness, correctness, and potential issues using standards
              relevant to the Public Land Survey System (PLSS) and Washington state property descriptions.`
            },
            {
              role: "user",
              content: `Please validate this legal description:

${description}

Generate a JSON object with these fields:
- validationScore: Number from 0-100 representing how valid/complete the description is
- issues: Array of potential issues found (strings)
- recommendations: Array of recommendations to improve the description (strings)
- interpretation: Plain English explanation of what this legal description means
- boundaryDescription: Simplified description of the boundary in plain English
- drawingInstructions: Step by step instructions that would help someone draw this parcel manually (array of strings)`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        const openaiResult = JSON.parse(response.choices[0].message.content);
        logger.info('Successfully validated legal description with OpenAI GPT-4o');
        
        return {
          validationScore: openaiResult.validationScore,
          issues: openaiResult.issues || [],
          recommendations: openaiResult.recommendations || [],
          interpretation: openaiResult.interpretation || "No interpretation available",
          boundaryDescription: openaiResult.boundaryDescription || "No boundary description available",
          drawingInstructions: openaiResult.drawingInstructions || [],
          validationMethod: 'openai-gpt4o'
        };
      }
    } catch (error: any) {
      logger.warn(`Error using OpenAI for validation: ${error.message}`);
    }
    
    // If both AI services fail, use basic regex validation as last resort
    logger.info('Using basic regex validation as fallback');
    
    const hasSection = description.match(/Section\s+(\d+)/i) !== null;
    const hasTownship = description.match(/Township\s+(\d+)\s+North/i) !== null;
    const hasRange = description.match(/Range\s+(\d+)\s+East/i) !== null;
    const hasMeridian = description.match(/Willamette\s+Meridian/i) !== null;
    const hasAcreage = description.match(/(\d+\.\d+)\s+acres/i) !== null;
    const hasQuarterSection = description.match(/(N[EW]|S[EW])\s+1\/4/i) !== null;
    const hasBoundaries = description.match(/(N|S)\s*(\d+)°(\d+)'(\d+)"/i) !== null;
    
    const issues = [];
    if (!hasSection) issues.push("Missing section information");
    if (!hasTownship) issues.push("Missing township information");
    if (!hasRange) issues.push("Missing range information");
    if (!hasMeridian) issues.push("Missing meridian reference");
    if (!hasAcreage) issues.push("Missing acreage information");
    
    const recommendations = [];
    if (!hasSection) recommendations.push("Add section number");
    if (!hasTownship) recommendations.push("Add township designation");
    if (!hasRange) recommendations.push("Add range designation");
    if (!hasMeridian) recommendations.push("Add meridian reference (Willamette Meridian for Benton County)");
    if (!hasAcreage) recommendations.push("Include parcel acreage");
    if (!hasQuarterSection && !hasBoundaries) recommendations.push("Specify quarter sections or boundary measurements");
    
    // Calculate a validation score
    const validationScore = 100 - (issues.length * 15);
    
    // Extract essential information for interpretation
    const section = description.match(/Section\s+(\d+)/i)?.[1] || "unknown section";
    const township = description.match(/Township\s+(\d+)\s+North/i)?.[1] || "unknown township";
    const range = description.match(/Range\s+(\d+)\s+East/i)?.[1] || "unknown range";
    const acreage = description.match(/(\d+\.\d+)\s+acres/i)?.[1] || "unknown acreage";
    
    return {
      validationScore: Math.max(0, validationScore),
      issues,
      recommendations,
      interpretation: `This appears to be a property in Section ${section}, Township ${township} North, Range ${range} East, of approximately ${acreage} acres.`,
      boundaryDescription: "Property boundaries cannot be determined from basic validation.",
      drawingInstructions: [
        "Basic validation cannot provide reliable drawing instructions.",
        "Consider using AI assistance or consulting a professional surveyor."
      ],
      validationMethod: 'basic-regex'
    };
  } catch (error: any) {
    logger.error('Error validating legal description:', error);
    throw new Error(`Failed to validate legal description: ${error.message}`);
  }
}

/**
 * Get static fairground parcels data
 */
export function getFairgroundParcels() {
  return FAIRGROUND_PARCELS;
}

/**
 * Get a specific fairground parcel by ID
 */
export function getFairgroundParcel(id: string) {
  return FAIRGROUND_PARCELS.find(p => p.id === id);
}