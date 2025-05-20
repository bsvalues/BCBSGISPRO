/**
 * Map Intelligence Service
 * 
 * This service provides AI-powered map analysis capabilities by interfacing with
 * the map intelligence API, which uses Anthropic's Claude to generate insights.
 */

interface MapFeature {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties?: Record<string, any>;
}

interface MapState {
  features: MapFeature[];
}

interface MapViewState {
  center: { lat: number; lng: number };
  zoom: number;
  bearing: number;
  pitch: number;
}

interface MapContext {
  mapState: MapState | null;
  viewState: MapViewState | null;
  layers: Record<string, boolean>;
  lastAction: string | null;
}

/**
 * Analyzes a map query and context to provide intelligent suggestions
 * Uses the Anthropic Claude API through our backend proxy
 */
export async function analyzeMapQuery(query: string, context: MapContext | null = null): Promise<string> {
  try {
    const response = await fetch('/api/map-intelligence/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context: context ? JSON.stringify(context) : null,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error analyzing map query:', error);
    return `Sorry, I couldn't analyze your query. Please try again later. ${error instanceof Error ? error.message : ''}`;
  }
}

/**
 * Generates suggestions for map improvements based on the current map state
 */
export async function suggestMapImprovements(mapState: MapState): Promise<string> {
  try {
    const response = await fetch('/api/map-intelligence/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mapState }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error suggesting map improvements:', error);
    return `Sorry, I couldn't generate map suggestions. Please try again later. ${error instanceof Error ? error.message : ''}`;
  }
}

/**
 * Analyzes selected map features and provides information about them
 */
export async function analyzeMapFeatures(features: MapFeature[]): Promise<string> {
  try {
    const response = await fetch('/api/map-intelligence/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing map features:', error);
    return `Sorry, I couldn't analyze these map features. Please try again later. ${error instanceof Error ? error.message : ''}`;
  }
}