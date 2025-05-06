import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LegalDescriptionResult, LegalDescriptionVisualization, ParsedLegalDescription } from '../../shared/schema';

const router = express.Router();

// Initialize OpenAI and Anthropic clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Schema for legal description requests
const legalDescriptionRequestSchema = z.object({
  description: z.string().min(1, 'Legal description is required')
});

const visualizationRequestSchema = z.object({
  description: z.string().min(1, 'Legal description is required'),
  baseCoordinate: z.tuple([z.number(), z.number()]).optional()
});

/**
 * Analyze a legal description using AI
 * This endpoint processes legal descriptions using Claude and provides validation, issues, and recommendations
 */
router.post('/analyze', asyncHandler(async (req, res) => {
  // Validate request body
  const result = legalDescriptionRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      message: 'Invalid request data', 
      errors: result.error.errors 
    });
  }

  const { description } = result.data;
  
  try {
    // Use Claude to analyze the legal description
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: `You are an expert in legal property descriptions used in Benton County, Washington. 
        Analyze legal descriptions with expertise in land surveying, GIS, and property law.
        Provide validation, identify issues, offer recommendations, and give a clear interpretation with precise boundary descriptions.
        Format output as valid JSON with these fields: 
        {
          "validationScore": number (0-100),
          "issues": string[],
          "recommendations": string[],
          "interpretation": string,
          "boundaryDescription": string,
          "drawingInstructions": string[]
        }`,
      messages: [
        {
          role: 'user',
          content: `Analyze this Benton County, Washington legal property description in detail:\n\n${description}`
        }
      ],
    });

    // Extract JSON from the response
    const content = response.content[0].text;
    const analysisResult: LegalDescriptionResult = JSON.parse(content);
    
    return res.json({ 
      message: 'Legal description analyzed successfully',
      data: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing legal description:', error);
    return res.status(500).json({ 
      message: 'Failed to analyze legal description',
      error: error.message 
    });
  }
}));

/**
 * Parse a legal description to extract structured information
 * This endpoint breaks down legal descriptions into components like section, township, range, etc.
 */
router.post('/parse', asyncHandler(async (req, res) => {
  // Validate request body
  const result = legalDescriptionRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      message: 'Invalid request data', 
      errors: result.error.errors 
    });
  }

  const { description } = result.data;
  
  try {
    // Use GPT-4o to parse the legal description
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert GIS analyst for Benton County, Washington. 
            Parse legal descriptions and extract structured information.
            Output must be valid JSON with the following format:
            {
              "section": string or null,
              "township": string or null,
              "range": string or null,
              "plat": string or null,
              "lot": string or null,
              "block": string or null,
              "subdivision": string or null,
              "boundaryPoints": string[] or null,
              "acreage": string or null,
              "quarterSections": string[] or null,
              "rawDescription": string (original description)
            }
            Only include fields if they are mentioned in the description.`
        },
        {
          role: "user", 
          content: `Parse this Benton County, Washington legal property description:\n\n${description}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    // Handle null content case (shouldn't happen with proper response_format)
    if (!content) {
      return res.status(500).json({ message: 'Failed to parse legal description - empty response' });
    }
    
    const parsedResult: ParsedLegalDescription = JSON.parse(content);
    
    // Ensure rawDescription is included
    if (!parsedResult.rawDescription) {
      parsedResult.rawDescription = description;
    }
    
    return res.json({ 
      message: 'Legal description parsed successfully',
      data: parsedResult
    });
  } catch (error) {
    console.error('Error parsing legal description:', error);
    return res.status(500).json({ 
      message: 'Failed to parse legal description',
      error: error.message 
    });
  }
}));

/**
 * Generate visualization data for a legal description
 * This endpoint creates coordinate data and GeoJSON for mapping
 */
router.post('/visualize', asyncHandler(async (req, res) => {
  // Validate request body
  const result = visualizationRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      message: 'Invalid request data', 
      errors: result.error.errors 
    });
  }

  const { description, baseCoordinate } = result.data;
  
  // Default coordinates for Benton County if none provided
  const defaultBase: [number, number] = [-119.3030, 46.2115]; // Benton County, WA
  const startCoordinate = baseCoordinate || defaultBase;
  
  try {
    // Use Claude to generate visualization data
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: `You are an expert in GIS and geospatial data visualization for Benton County, Washington.
        Convert legal property descriptions into structured data that can be visualized on a map.
        Use the provided base coordinate as a starting point if available, otherwise make a reasonable estimation.
        Return valid JSON with the following structure:
        {
          "coordinates": array of [longitude, latitude] points forming the property boundary,
          "cardinalPoints": array of strings describing cardinal directions of property lines,
          "shapeType": string (polygon, rectangle, irregular, etc.),
          "estimatedArea": number (in acres),
          "geometry": GeoJSON geometry object
        }`,
      messages: [
        {
          role: 'user',
          content: `Convert this Benton County, Washington legal property description to visualization data:\n\n${description}\n\nUse this base coordinate as a starting reference point: [${startCoordinate[0]}, ${startCoordinate[1]}]`
        }
      ],
    });

    // Extract JSON from the response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return res.status(500).json({ message: 'Failed to extract valid JSON from the AI response' });
    }
    
    const visualizationData: LegalDescriptionVisualization = JSON.parse(jsonMatch[0]);
    
    return res.json({ 
      message: 'Visualization data generated successfully',
      data: visualizationData
    });
  } catch (error) {
    console.error('Error generating visualization:', error);
    return res.status(500).json({ 
      message: 'Failed to generate visualization data',
      error: error.message 
    });
  }
}));

export default router;