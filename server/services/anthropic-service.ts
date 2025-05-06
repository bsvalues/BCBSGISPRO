import Anthropic from '@anthropic-ai/sdk';
import { LegalDescriptionResult, ParsedLegalDescription } from '../../shared/schema';
import { logger } from '../logger';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parses and analyzes legal descriptions from Benton County property records
 * using Anthropic Claude's advanced NLP capabilities
 */
export class LegalDescriptionService {
  
  /**
   * Parse a raw legal description text into structured components
   * 
   * @param legalText The raw legal description text from property records
   * @returns Structured legal description components
   */
  async parseLegalDescription(legalText: string): Promise<ParsedLegalDescription> {
    try {
      const systemPrompt = `
        You are an expert land surveyor and legal analyst for Benton County, Washington.
        Parse the provided legal description into its structured components.
        Return a JSON object with the following fields:
        - section: Section number
        - township: Township identifier (e.g. "T9N")
        - range: Range identifier (e.g. "R28E")
        - plat: Plat name if provided
        - lot: Lot number
        - block: Block number
        - subdivision: Subdivision name
        - boundaryPoints: Array of cardinal direction measurements
        - acreage: Acreage value if specified
        - quarterSections: Array of quarter section references
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        max_tokens: 1024,
        messages: [
          { role: 'user', content: legalText || "No legal description provided." }
        ],
      });

      const result = JSON.parse(response.content[0].text);
      
      return {
        section: result.section,
        township: result.township,
        range: result.range,
        plat: result.plat,
        lot: result.lot,
        block: result.block,
        subdivision: result.subdivision,
        boundaryPoints: result.boundaryPoints,
        acreage: result.acreage,
        quarterSections: result.quarterSections,
        rawDescription: legalText
      };
    } catch (error) {
      logger.error('Error parsing legal description:', error);
      throw new Error(`Failed to parse legal description: ${error.message}`);
    }
  }

  /**
   * Analyze a legal description for potential issues, ambiguities,
   * or validation concerns. Provides expert insights on the property description.
   * 
   * @param legalText The raw legal description text
   * @returns Analysis results and recommendations
   */
  async analyzeLegalDescription(legalText: string): Promise<LegalDescriptionResult> {
    try {
      const systemPrompt = `
        You are an expert GIS analyst and land surveyor for Benton County, Washington.
        Analyze the provided legal description for potential issues, ambiguities, or validation concerns.
        Assess the quality and completeness of the description.
        
        Return a JSON object with the following fields:
        - validationScore: Number from 0-100 representing how valid/complete the description is
        - issues: Array of potential issues found
        - recommendations: Array of recommendations to improve or clarify the description
        - interpretation: Plain English explanation of what this legal description means
        - boundaryDescription: Simplified description of the boundary in plain English
        - drawingInstructions: Step by step instructions that would help someone draw this parcel manually
      `;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        max_tokens: 1500,
        messages: [
          { role: 'user', content: legalText || "No legal description provided." }
        ],
      });

      const result = JSON.parse(response.content[0].text);
      
      return {
        validationScore: result.validationScore,
        issues: result.issues,
        recommendations: result.recommendations,
        interpretation: result.interpretation,
        boundaryDescription: result.boundaryDescription,
        drawingInstructions: result.drawingInstructions
      };
    } catch (error) {
      logger.error('Error analyzing legal description:', error);
      throw new Error(`Failed to analyze legal description: ${error.message}`);
    }
  }

  /**
   * Generate cardinal points and coordinates from a legal description
   * to help visualization and mapping on GIS systems
   * 
   * @param legalText The raw legal description text
   * @param baseCoordinate Base reference coordinate if available
   * @returns Coordinates and visualization data
   */
  async generateVisualizationData(legalText: string, baseCoordinate?: [number, number]): Promise<any> {
    try {
      const systemPrompt = `
        You are an expert GIS analyst for Benton County, Washington.
        Based on the provided legal description, generate visualization data including:
        1. A list of coordinates (if extractable)
        2. A GeoJSON polygon representation (if possible)
        3. Cardinal points and measurements
        
        If a base coordinate is provided, use it as a reference point.
        Otherwise, make reasonable estimations based on the description.
        Focus on creating data that would be useful for drawing the parcel on a map.
        
        Return results as JSON with these fields:
        - coordinates: Array of coordinate pairs [lng, lat]
        - cardinalPoints: Array of cardinal direction measurements
        - shapeType: "polygon", "rectangle", "irregular", etc.
        - estimatedArea: Estimated area in acres
        - geometry: GeoJSON geometry object if possible
      `;

      const userPrompt = baseCoordinate 
        ? `Legal Description: ${legalText}\nBase Coordinate: [${baseCoordinate[0]}, ${baseCoordinate[1]}]` 
        : `Legal Description: ${legalText}`;

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        max_tokens: 1500,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });

      const result = JSON.parse(response.content[0].text);
      return result;
    } catch (error) {
      logger.error('Error generating visualization data:', error);
      throw new Error(`Failed to generate visualization data: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const legalDescriptionService = new LegalDescriptionService();