/**
 * Geocoding Service for the BentonGeoPro application.
 * Provides reverse geocoding capabilities to convert coordinates to addresses.
 */

interface ReverseGeocodingResponse {
  status: 'success' | 'error';
  data?: {
    address: string;
    placeName?: string;
    formattedAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  message?: string;
}

/**
 * Convert latitude and longitude to a street address using the MapBox API
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @returns The address details
 */
export async function reverseGeocode(
  latitude: number, 
  longitude: number
): Promise<ReverseGeocodingResponse> {
  try {
    const response = await fetch(
      'https://mapbox-reverse-geocoding-api-latitude-and-longitude.p.rapidapi.com/getMapBoxAddress',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'mapbox-reverse-geocoding-api-latitude-and-longitude.p.rapidapi.com',
          'x-rapidapi-key': '451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55'
        },
        body: JSON.stringify({
          lat: latitude.toString(),
          lon: longitude.toString()
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.features && data.features.length > 0) {
      const feature = data.features[0];
      const place = feature.place_name || '';
      const addressParts = place.split(',').map((part: string) => part.trim());
      
      // Parse the response to get address components
      return {
        status: 'success',
        data: {
          address: place,
          placeName: feature.text || '',
          formattedAddress: place,
          city: addressParts.length > 1 ? addressParts[1] : '',
          state: addressParts.length > 2 ? addressParts[2] : '',
          postalCode: feature.context?.find((c: any) => c.id.startsWith('postcode'))?.text || '',
          country: addressParts.length > 3 ? addressParts[3] : 'USA'
        }
      };
    }
    
    return {
      status: 'error',
      message: 'No address found for these coordinates'
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get address from coordinates'
    };
  }
}

/**
 * Formats a full address string based on available address components
 * @param addressData The address data components
 * @returns Formatted address string
 */
export function formatAddress(addressData: {
  placeName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string {
  const { placeName, city, state, postalCode, country } = addressData;
  const parts = [];
  
  if (placeName) parts.push(placeName);
  if (city) parts.push(city);
  
  // Combine state and postal code
  const stateZip = [state, postalCode].filter(Boolean).join(' ');
  if (stateZip) parts.push(stateZip);
  
  if (country) parts.push(country);
  
  return parts.join(', ');
}