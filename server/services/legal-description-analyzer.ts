/**
 * Legal Description Analyzer Service
 * Specialized for analyzing parcel descriptions and boundaries
 */

import { logger } from '../logger';
import OpenAI from 'openai';

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
 * Parse a legal description and extract key components like bearings and distances
 */
export async function parseLegalDescription(description: string): Promise<any> {
  try {
    logger.info(`Parsing legal description: ${description.substring(0, 50)}...`);
    
    // Try to use OpenAI for parsing if available
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a specialized AI for analyzing legal property descriptions in Benton County, Washington. Extract structural information from the legal description, including section/township/range data, cardinal bearings, and boundary measurements."
            },
            {
              role: "user",
              content: description
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        logger.info(`Successfully parsed legal description`);
        return result;
      }
    } catch (error: any) {
      logger.warn(`Error using OpenAI for legal description parsing: ${error.message}`);
    }
    
    // If OpenAI not available or fails, use basic regex parsing
    const section = description.match(/Section\s+(\d+)/i)?.[1] || "";
    const township = description.match(/Township\s+(\d+)\s+North/i)?.[1] || "";
    const range = description.match(/Range\s+(\d+)\s+East/i)?.[1] || "";
    
    // Extract bearings and distances
    const bearingPattern = /(N|S)\s*(\d+)°(\d+)'(\d+)"\s*(E|W)/g;
    const distancePattern = /(\d+\.\d+)\s+feet/g;
    
    const bearings: string[] = [];
    const distances: string[] = [];
    
    let match;
    while ((match = bearingPattern.exec(description)) !== null) {
      bearings.push(match[0]);
    }
    
    while ((match = distancePattern.exec(description)) !== null) {
      distances.push(match[0]);
    }
    
    return {
      section,
      township,
      range,
      bearings,
      distances,
      meridian: "Willamette",
      acreage: description.match(/(\d+\.\d+)\s+acres/i)?.[1] || ""
    };
  } catch (error: any) {
    logger.error('Error parsing legal description:', error);
    throw new Error(`Failed to parse legal description: ${error.message}`);
  }
}

/**
 * Visualize a legal description by creating a graphical representation
 */
export async function visualizeLegalDescription(description: string): Promise<any> {
  try {
    logger.info(`Visualizing legal description: ${description.substring(0, 50)}...`);
    
    // First look for a matching parcel in our static data
    const foundParcel = FAIRGROUND_PARCELS.find(p => 
      description.includes(p.name) || (description.length > 20 && p.description.startsWith(description.substring(0, 20)))
    );
    
    if (foundParcel) {
      logger.info(`Found matching predefined parcel: ${foundParcel.name}`);
      return {
        ...foundParcel,
        source: "predefined"
      };
    }
    
    // Try to use OpenAI for visualization if available
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a specialized AI for analyzing legal property descriptions. Generate a visualization structure for the property boundaries described in the legal description."
            },
            {
              role: "user",
              content: `Please create a visualization structure for this property description:\n\n${description}\n\nGenerate a JSON object with these fields: id, name, acreage, and boundaryPoints (an array of objects with direction and distance properties).`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        logger.info(`Successfully generated visualization data`);
        
        // Add generic coordinates since we can't determine actual geo coordinates
        result.coordinates = [
          { lat: 46.2200, lng: -119.2100 },
          { lat: 46.2220, lng: -119.2100 },
          { lat: 46.2220, lng: -119.2050 },
          { lat: 46.2200, lng: -119.2050 }
        ];
        
        result.source = "ai-generated";
        return result;
      }
    } catch (error: any) {
      logger.warn(`Error using OpenAI for visualization: ${error.message}`);
    }
    
    // If OpenAI not available or fails, return a generic visualization
    return {
      id: "generic-parcel",
      name: "Parcel",
      description: description.substring(0, 100) + "...",
      acreage: description.match(/(\d+\.\d+)\s+acres/i)?.[1] || "Unknown",
      coordinates: [
        { lat: 46.2200, lng: -119.2100 },
        { lat: 46.2220, lng: -119.2100 },
        { lat: 46.2220, lng: -119.2050 },
        { lat: 46.2200, lng: -119.2050 }
      ],
      boundaryPoints: [],
      source: "generic"
    };
  } catch (error: any) {
    logger.error('Error visualizing legal description:', error);
    throw new Error(`Failed to visualize legal description: ${error.message}`);
  }
}

/**
 * Validate a legal description for completeness and correctness
 */
export async function validateLegalDescription(description: string): Promise<any> {
  try {
    logger.info(`Validating legal description: ${description.substring(0, 50)}...`);
    
    // Try to use OpenAI for validation if available
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a specialized AI for analyzing legal property descriptions in Benton County, Washington. Validate the legal description for completeness, correctness, and potential issues."
            },
            {
              role: "user",
              content: `Please validate this legal description:\n\n${description}\n\nGenerate a JSON object with these fields: isValid (boolean), confidence (0-100), issues (array of strings describing any problems), and recommendations (array of strings with suggestions for improvement).`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        
        const result = JSON.parse(response.choices[0].message.content);
        logger.info(`Successfully validated legal description`);
        return result;
      }
    } catch (error: any) {
      logger.warn(`Error using OpenAI for validation: ${error.message}`);
    }
    
    // Basic validation checks if OpenAI not available
    const hasSection = description.match(/Section\s+(\d+)/i) !== null;
    const hasTownship = description.match(/Township\s+(\d+)\s+North/i) !== null;
    const hasRange = description.match(/Range\s+(\d+)\s+East/i) !== null;
    const hasMeridian = description.match(/Willamette\s+Meridian/i) !== null;
    const hasAcreage = description.match(/(\d+\.\d+)\s+acres/i) !== null;
    
    const issues = [];
    if (!hasSection) issues.push("Missing section information");
    if (!hasTownship) issues.push("Missing township information");
    if (!hasRange) issues.push("Missing range information");
    if (!hasMeridian) issues.push("Missing meridian reference");
    if (!hasAcreage) issues.push("Missing acreage information");
    
    return {
      isValid: issues.length === 0,
      confidence: issues.length === 0 ? 90 : (100 - (issues.length * 20)),
      issues,
      recommendations: issues.length > 0 ? ["Add missing components to the legal description"] : []
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