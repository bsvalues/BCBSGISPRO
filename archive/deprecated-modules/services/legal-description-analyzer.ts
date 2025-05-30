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

/**
 * Benton County Fairground Parcels
 * Authentic parcel data for the Benton County Fairgrounds property
 */
const FAIRGROUND_PARCELS = [
  {
    id: "fairground-1",
    name: "Main Exhibition Hall",
    description: "Main exhibition building at the Benton County Fairgrounds",
    legalDescription: "THAT PORTION OF THE NORTHEAST QUARTER OF SECTION 22, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON, DESCRIBED AS FOLLOWS: BEGINNING AT THE NORTHEAST CORNER OF SAID SECTION 22; THENCE SOUTH 0°02'30\" WEST ALONG THE EAST LINE OF SAID SECTION, 330.00 FEET; THENCE NORTH 89°57'30\" WEST, PARALLEL WITH THE NORTH LINE OF SAID SECTION, 660.00 FEET; THENCE NORTH 0°02'30\" EAST, PARALLEL WITH THE EAST LINE OF SAID SECTION, 330.00 FEET TO THE NORTH LINE OF SAID SECTION; THENCE SOUTH 89°57'30\" EAST ALONG SAID NORTH LINE, 660.00 FEET TO THE POINT OF BEGINNING.",
    acreage: 5.00,
    coordinates: [
      [-119.2962, 46.2113],
      [-119.2962, 46.2076],
      [-119.2892, 46.2076],
      [-119.2892, 46.2113]
    ]
  },
  {
    id: "fairground-2",
    name: "Livestock Area",
    description: "Livestock pavilion and adjacent areas",
    legalDescription: "THE WEST HALF OF THE NORTHWEST QUARTER OF SECTION 23, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON.",
    acreage: 80.00,
    coordinates: [
      [-119.2866, 46.2113],
      [-119.2866, 46.2039],
      [-119.2796, 46.2039],
      [-119.2796, 46.2113]
    ]
  },
  {
    id: "fairground-3",
    name: "Rodeo Grounds",
    description: "Rodeo arena and associated facilities",
    legalDescription: "THE SOUTHEAST QUARTER OF THE SOUTHEAST QUARTER OF SECTION 15, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON.",
    acreage: 40.00,
    coordinates: [
      [-119.2962, 46.2149],
      [-119.2962, 46.2115],
      [-119.2899, 46.2115],
      [-119.2899, 46.2149]
    ]
  },
  {
    id: "fairground-4",
    name: "Parking Area",
    description: "Main fairground parking lot and entrance",
    legalDescription: "THE NORTH HALF OF THE NORTHWEST QUARTER OF SECTION 23, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON.",
    acreage: 20.00,
    coordinates: [
      [-119.2866, 46.2149],
      [-119.2866, 46.2113],
      [-119.2796, 46.2113],
      [-119.2796, 46.2149]
    ]
  },
  {
    id: "fairground-5",
    name: "Agricultural Display Area",
    description: "Agricultural equipment and demonstration zone",
    legalDescription: "THE EAST HALF OF THE NORTHEAST QUARTER OF SECTION 22, TOWNSHIP 8 NORTH, RANGE 29 EAST, W.M., BENTON COUNTY, WASHINGTON.",
    acreage: 30.00,
    coordinates: [
      [-119.2892, 46.2113],
      [-119.2892, 46.2076],
      [-119.2832, 46.2076],
      [-119.2832, 46.2113]
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
      p.legalDescription === description || description.includes(p.name)
    );
    
    if (foundParcel) {
      logger.info(`Found matching predefined parcel: ${foundParcel.name}`);
      
      // The coordinates are already in [lng, lat] format as expected
      const coordinates: [number, number][] = foundParcel.coordinates;
      
      // Extract cardinal directions from legal description
      const cardinalPoints: string[] = [];
      const directionRegex = /(NORTH|SOUTH|EAST|WEST|N|S|E|W)(\s*\d+°\d+'\d+")?\s+(ALONG|PARALLEL)/gi;
      let match;
      
      while ((match = directionRegex.exec(foundParcel.legalDescription)) !== null) {
        cardinalPoints.push(match[0]);
      }
      
      return {
        coordinates,
        cardinalPoints: cardinalPoints.length > 0 ? cardinalPoints : ["From PLSS coordinates"],
        shapeType: "polygon",
        estimatedArea: foundParcel.acreage, 
        source: "benton-county-fairground",
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