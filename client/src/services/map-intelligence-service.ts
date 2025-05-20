import { toast } from "../components/ui/use-toast";

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
export async function analyzeMapQuery(query: string, context: string): Promise<string> {
  try {
    // Send to backend which will forward to Anthropic API
    const response = await fetch('/api/map-intelligence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error in map intelligence service:', error);
    toast({
      title: 'AI Assistant Error',
      description: 'Unable to analyze map data. Please try again later.',
      variant: 'destructive',
    });
    return 'I apologize, but I encountered an error analyzing your map. Please try again later.';
  }
}

/**
 * Generates suggestions for map improvements based on the current map state
 */
export async function suggestMapImprovements(mapState: MapState): Promise<string> {
  // This would be a specialized endpoint for map improvements
  try {
    const response = await fetch('/api/map-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mapState }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error generating map suggestions:', error);
    return 'Unable to generate map improvement suggestions at this time.';
  }
}

/**
 * Analyzes selected map features and provides information about them
 */
export async function analyzeMapFeatures(features: MapFeature[]): Promise<string> {
  // This would be a specialized endpoint for feature analysis
  try {
    const response = await fetch('/api/analyze-features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Error analyzing map features:', error);
    return 'Unable to analyze map features at this time.';
  }
}