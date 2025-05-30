/**
 * Property Service for the BentonGeoPro application.
 * Provides API access to retrieve property data from Zillow via RapidAPI.
 */

export interface PropertyListing {
  zpid: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea: number;
  homeType: string;
  photos: string[];
  statusType: string;
  latitude: number;
  longitude: number;
  lotSize?: number;
  yearBuilt?: number;
  description?: string;
  url?: string;
}

export interface PropertySearchResponse {
  results: PropertyListing[];
  totalResults: number;
  pagination: {
    currentPage: number;
    totalPages: number;
  };
}

export interface PropertySearchParams {
  location: string;
  page?: number;
  price_min?: number;
  price_max?: number;
  beds_min?: number;
  baths_min?: number;
  home_types?: string; // comma-separated: houses, apartments, manufactured
  searchType?: 'forsale' | 'forrent' | 'sold';
}

export interface PropertyCoordinateSearchParams {
  latitude: number;
  longitude: number;
  radius_miles?: number;
}

/**
 * Search for properties based on location and other criteria
 * @param params Search parameters including location, price range, etc.
 * @returns List of property listings matching the criteria
 */
export async function searchProperties(
  params: PropertySearchParams
): Promise<PropertySearchResponse | null> {
  try {
    // Build the query parameters
    const queryParams = new URLSearchParams({
      searchType: params.searchType || 'forsale',
      location: params.location
    });
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.price_min) queryParams.append('price_min', params.price_min.toString());
    if (params.price_max) queryParams.append('price_max', params.price_max.toString());
    if (params.beds_min) queryParams.append('beds_min', params.beds_min.toString());
    if (params.baths_min) queryParams.append('baths_min', params.baths_min.toString());
    if (params.home_types) queryParams.append('home_types', params.home_types);
    
    const response = await fetch(
      `https://zillow-com-property-data.p.rapidapi.com/extended_search.php?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'zillow-com-property-data.p.rapidapi.com',
          'x-rapidapi-key': '451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Property search API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map the API response to our interface
    const result: PropertySearchResponse = {
      results: (data.results || []).map((item: any) => ({
        zpid: item.zpid || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        zipcode: item.zipcode || '',
        price: parseFloat(item.price || '0'),
        bedrooms: parseFloat(item.bedrooms || '0'),
        bathrooms: parseFloat(item.bathrooms || '0'),
        livingArea: parseFloat(item.livingArea || '0'),
        homeType: item.homeType || '',
        photos: item.photos || [],
        statusType: item.statusType || '',
        latitude: parseFloat(item.latitude || '0'),
        longitude: parseFloat(item.longitude || '0'),
        lotSize: item.lotSize ? parseFloat(item.lotSize) : undefined,
        yearBuilt: item.yearBuilt ? parseInt(item.yearBuilt) : undefined,
        description: item.description,
        url: item.url
      })),
      totalResults: data.totalResultCount || 0,
      pagination: {
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error searching properties:', error);
    return null;
  }
}

/**
 * Search for properties near specified coordinates
 * @param params Search parameters including latitude, longitude and radius
 * @returns List of property listings near the coordinates
 */
export async function searchPropertiesByCoordinates(
  params: PropertyCoordinateSearchParams
): Promise<PropertySearchResponse | null> {
  try {
    // Convert coordinates to a location string for the API
    // The API doesn't directly support coordinate search, so we use the reverse geocoding
    // result as the location parameter
    const { latitude, longitude, radius_miles = 1 } = params;
    
    // Use a formatted coordinate string as the location
    const location = `${latitude},${longitude}`;
    
    // Call the standard search with the coordinate location
    return searchProperties({
      location,
      searchType: 'forsale'
    });
  } catch (error) {
    console.error('Error searching properties by coordinates:', error);
    return null;
  }
}