/**
 * Document Analyzer Service
 * 
 * This service uses OpenAI Vision to analyze property documents, extract text,
 * and identify key information like legal descriptions, parcel numbers, and more.
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';

interface DocumentAnalysisResult {
  title: string;
  propertyInfo: {
    parcelNumber?: string;
    legalDescription?: string;
    owner?: string;
    address?: string;
  };
  extractedText: string;
  confidence: number;
  metadata: {
    documentType: string;
    pageCount: number;
    createdAt: Date;
  };
}

/**
 * Extracts text from a document image using OpenAI Vision
 */
async function extractTextFromImage(imagePath: string): Promise<string> {
  try {
    // Read the image file as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "user", 
          content: [
            { 
              type: "text", 
              text: "Extract all text from this document image. Maintain formatting where possible." 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    logger.error('Error extracting text from image:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Analyze document text to extract property information using OpenAI
 */
async function analyzeDocumentText(text: string): Promise<{
  title: string;
  propertyInfo: {
    parcelNumber?: string;
    legalDescription?: string;
    owner?: string;
    address?: string;
  };
  documentType: string;
  confidence: number;
}> {
  try {
    const systemPrompt = `
      You are a specialized AI for analyzing property documents like title reports, deeds, and legal descriptions.
      Your task is to:
      1. Extract the most likely document title
      2. Determine the document type (e.g., Title Report, Deed, Legal Description, etc.)
      3. Extract property information including:
         - Parcel number/tax ID (if present)
         - Legal description (full text, exactly as written)
         - Property owner(s) name(s)
         - Property address
      4. Assign a confidence score (0-100) based on how certain you are about the extracted information
      
      Focus especially on correctly identifying legal descriptions. These typically contain phrases like:
      - "LOT", "BLOCK", "SUBDIVISION"
      - "ACCORDING TO THE PLAT THEREOF RECORDED"
      - References to "SECTION", "TOWNSHIP", "RANGE"
      - Directional measurements with degrees, minutes, seconds

      Output in JSON format with the following structure:
      {
        "title": "Brief title for the document",
        "documentType": "The type of document identified",
        "confidence": number between 0-100,
        "propertyInfo": {
          "parcelNumber": "Extracted parcel number or null",
          "legalDescription": "Full legal description as written or null",
          "owner": "Property owner name(s) or null",
          "address": "Property address or null"
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    logger.error('Error analyzing document text:', error);
    throw new Error(`Failed to analyze document text: ${error.message}`);
  }
}

/**
 * Main function to analyze a document
 */
export async function analyzeDocument(
  filePath: string, 
  originalFilename: string
): Promise<DocumentAnalysisResult> {
  try {
    logger.info(`Analyzing document: ${originalFilename}`);
    
    // Extract text from the document
    const extractedText = await extractTextFromImage(filePath);
    logger.info(`Text extraction complete: ${extractedText.length} characters`);
    
    // Analyze the extracted text
    const analysisResult = await analyzeDocumentText(extractedText);
    logger.info(`Document analysis complete with confidence: ${analysisResult.confidence}%`);
    
    // Calculate page count (mock value for image files)
    const pageCount = 1; // For simplicity, single page for all images
    
    // Create the final result object
    const result: DocumentAnalysisResult = {
      title: analysisResult.title,
      propertyInfo: analysisResult.propertyInfo,
      extractedText: extractedText,
      confidence: analysisResult.confidence,
      metadata: {
        documentType: analysisResult.documentType,
        pageCount: pageCount,
        createdAt: new Date()
      }
    };
    
    return result;
  } catch (error) {
    logger.error('Document analysis failed:', error);
    throw new Error(`Document analysis failed: ${error.message}`);
  }
}