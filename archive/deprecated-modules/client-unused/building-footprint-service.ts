/**
 * Building Footprint Service for the BentonGeoPro application.
 * Provides API access to retrieve building footprints for visualization on maps.
 */

export interface BuildingFootprintResponse {
  type: string;
  features: Array<{
    type: string;
    properties: {
      id: string;
      [key: string]: any;
    };
    geometry: {
      type: string;
      coordinates: Array<Array<Array<number>>>;
    };
  }>;
}

/**
 * Fetches building footprint data for a specific map tile
 * @param z Zoom level
 * @param x X coordinate of the tile
 * @param y Y coordinate of the tile
 * @returns GeoJSON data containing building footprints
 */
export async function fetchBuildingFootprints(
  z: number,
  x: number,
  y: number
): Promise<BuildingFootprintResponse | null> {
  try {
    const response = await fetch(
      `https://openindoor-building-footprint.p.rapidapi.com/maps/openindoor/footprint/${z}/${x}/${y}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'openindoor-building-footprint.p.rapidapi.com',
          'x-rapidapi-key': '451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Building footprint API error: ${response.status}`);
    }

    const data: BuildingFootprintResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching building footprints:', error);
    return null;
  }
}

/**
 * Converts leaflet bounds and zoom to tile coordinates for the building footprint API
 * @param bounds The map bounds
 * @param zoom The current zoom level
 * @returns An array of tile coordinates [z, x, y] for fetching building data
 */
export function boundsToTileCoordinates(bounds: L.LatLngBounds, zoom: number): Array<[number, number, number]> {
  const tiles: Array<[number, number, number]> = [];
  
  // Round zoom to the nearest valid zoom level for the API
  const z = Math.min(Math.max(Math.round(zoom), 14), 19);
  
  // Convert bounds to tile coordinates
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  
  // Calculate tile coordinates
  const n = Math.pow(2, z);
  
  // Northwest tile
  const x1 = Math.floor((southWest.lng + 180) / 360 * n);
  const y1 = Math.floor((1 - Math.log(Math.tan(northEast.lat * Math.PI / 180) + 1 / Math.cos(northEast.lat * Math.PI / 180)) / Math.PI) / 2 * n);
  
  // Southeast tile
  const x2 = Math.floor((northEast.lng + 180) / 360 * n);
  const y2 = Math.floor((1 - Math.log(Math.tan(southWest.lat * Math.PI / 180) + 1 / Math.cos(southWest.lat * Math.PI / 180)) / Math.PI) / 2 * n);
  
  // Limit the number of tiles to prevent excessive API calls
  const maxTiles = 6;
  const tileCount = Math.min((x2 - x1 + 1) * (y2 - y1 + 1), maxTiles);
  
  if (tileCount >= maxTiles) {
    // Just return the center tile if too many tiles would be fetched
    const center = bounds.getCenter();
    const centerX = Math.floor((center.lng + 180) / 360 * n);
    const centerY = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * n);
    
    tiles.push([z, centerX, centerY]);
    return tiles;
  }
  
  // Add all tiles in the view
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      tiles.push([z, x, y]);
    }
  }
  
  return tiles;
}