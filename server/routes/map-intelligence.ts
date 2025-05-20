import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { asyncHandler } from "../error-handler";
import { logger } from "../logger";

const router = express.Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for map intelligence assistance
const SYSTEM_PROMPT = `You are Map Intelligence AI, a specialized geographic information system assistant for Benton County GIS.
You help users with map analysis, feature identification, and geographic data interpretation.
Your responses should be concise, helpful, and focused on map-related tasks.

When analyzing map data, follow these guidelines:
1. For parcel data, focus on identifying key attributes like size, zoning, and location context
2. For geographic features, help identify what they represent and their relationship to other map elements
3. Provide practical suggestions that are relevant to county planning, assessment, or property management
4. If you don't have enough information, ask for specific data that would help your analysis
5. Always maintain awareness of standard GIS mapping concepts and terminology

Remember that you're assisting with official county GIS work, so maintain a professional tone.`;

// Route to handle general map intelligence queries
router.post("/query", asyncHandler(async (req, res) => {
  const { query, context } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  // Format the context if available
  let formattedContext = "";
  if (context) {
    try {
      const parsedContext = JSON.parse(context);
      formattedContext = `
Current map state:
- Center: ${parsedContext.viewState?.center ? `Lat ${parsedContext.viewState.center.lat.toFixed(4)}, Lng ${parsedContext.viewState.center.lng.toFixed(4)}` : 'Unknown'}
- Zoom: ${parsedContext.viewState?.zoom || 'Unknown'}
- Visible Layers: ${Object.entries(parsedContext.layers || {})
  .filter(([_, isVisible]) => isVisible)
  .map(([layer]) => layer)
  .join(', ')}
- Features: ${parsedContext.mapState?.features ? parsedContext.mapState.features.length : 0} features on map
- Last Action: ${parsedContext.lastAction || 'None'}
`;
    } catch (error) {
      logger.error("Error parsing map context:", error);
      formattedContext = `Unable to parse context: ${context}`;
    }
  }

  // Create the message using Claude API
  // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    system: SYSTEM_PROMPT,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Map question: ${query}\n\n${formattedContext ? `Map context:\n${formattedContext}` : ''}`
      }
    ],
  });

  // Extract the response content
  const responseContent = message.content[0].type === 'text' 
    ? message.content[0].text 
    : 'Unable to process response';

  return res.json({ 
    response: responseContent,
    status: "success"
  });
}));

// Route to generate map improvement suggestions
router.post("/suggestions", asyncHandler(async (req, res) => {
  const { mapState } = req.body;

  if (!mapState) {
    return res.status(400).json({ error: "Map state is required" });
  }

  // Format the map state for the AI
  const formattedMapState = `
Map has ${mapState.features.length} features:
${mapState.features.map((feature, index) => 
  `${index + 1}. ${feature.geometry.type} (ID: ${feature.id}${feature.properties?.name ? `, Name: ${feature.properties.name}` : ''})`
).join('\n')}
`;

  // Create the message using Claude API
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    system: SYSTEM_PROMPT,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Please suggest improvements for this map:\n\n${formattedMapState}\n\nFocus on what elements might be missing, better organization, or additional data that would make this map more useful for Benton County officials.`
      }
    ],
  });

  // Extract the suggestions
  const suggestions = message.content[0].type === 'text'
    ? message.content[0].text
    : 'Unable to generate suggestions';

  return res.json({ 
    suggestions,
    status: "success" 
  });
}));

// Route to analyze map features
router.post("/analyze", asyncHandler(async (req, res) => {
  const { features } = req.body;

  if (!features || !Array.isArray(features) || features.length === 0) {
    return res.status(400).json({ error: "Valid features array is required" });
  }

  // Format the features for the AI
  const formattedFeatures = features.map((feature, index) => {
    let description = `Feature ${index + 1}: ${feature.geometry.type}`;
    
    if (feature.properties) {
      const propertyEntries = Object.entries(feature.properties)
        .filter(([key]) => key !== 'id' && key !== '_id')
        .map(([key, value]) => `${key}: ${value}`);
      
      if (propertyEntries.length > 0) {
        description += ` with properties: ${propertyEntries.join(', ')}`;
      }
    }
    
    if (feature.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates;
      description += ` at location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } else if (feature.geometry.type === 'Polygon') {
      description += ` with ${feature.geometry.coordinates[0].length} vertices`;
    } else if (feature.geometry.type === 'LineString') {
      description += ` with ${feature.geometry.coordinates.length} points`;
    }
    
    return description;
  }).join('\n');

  // Create the message using Claude API
  const message = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    system: SYSTEM_PROMPT,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Please analyze these map features and provide insights:\n\n${formattedFeatures}\n\nFocus on what these features represent in the context of Benton County GIS data and any notable patterns or relationships between them.`
      }
    ],
  });

  // Extract the analysis
  const analysis = message.content[0].type === 'text'
    ? message.content[0].text
    : 'Unable to generate analysis';

  return res.json({ 
    analysis,
    status: "success" 
  });
}));

export default router;