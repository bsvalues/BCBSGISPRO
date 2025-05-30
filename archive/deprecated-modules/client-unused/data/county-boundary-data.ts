import { GeoJSONFeature } from '@/lib/map-utils';

// Sample Benton County boundary (simplified for demonstration)
export const bentonCountyBoundary: GeoJSONFeature = {
  type: 'Feature',
  properties: {
    countyName: 'Benton',
    state: 'Washington',
    population: 207502,
    area: 1760, // square miles
    established: 1905
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-119.33, 46.30],
      [-118.95, 46.30],
      [-118.95, 45.90],
      [-119.33, 45.90],
      [-119.33, 46.30]
    ]]
  }
};

// Sample township boundaries
export const bentonTownshipBoundaries: GeoJSONFeature[] = [
  {
    type: 'Feature',
    properties: {
      townshipName: 'Richland Township',
      townshipNumber: 'T9N',
      rangeNumber: 'R28E'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.28, 46.25],
        [-119.16, 46.25],
        [-119.16, 46.15],
        [-119.28, 46.15],
        [-119.28, 46.25]
      ]]
    }
  },
  {
    type: 'Feature',
    properties: {
      townshipName: 'Kennewick Township',
      townshipNumber: 'T8N',
      rangeNumber: 'R29E'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.15, 46.20],
        [-119.05, 46.20],
        [-119.05, 46.10],
        [-119.15, 46.10],
        [-119.15, 46.20]
      ]]
    }
  }
];

// Sample section boundaries
export const bentonSectionBoundaries: GeoJSONFeature[] = [
  {
    type: 'Feature',
    properties: {
      sectionNumber: 10,
      townshipNumber: 'T9N',
      rangeNumber: 'R28E',
      acres: 640
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.25, 46.22],
        [-119.22, 46.22],
        [-119.22, 46.19],
        [-119.25, 46.19],
        [-119.25, 46.22]
      ]]
    }
  },
  {
    type: 'Feature',
    properties: {
      sectionNumber: 15,
      townshipNumber: 'T8N',
      rangeNumber: 'R29E',
      acres: 640
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.13, 46.17],
        [-119.10, 46.17],
        [-119.10, 46.14],
        [-119.13, 46.14],
        [-119.13, 46.17]
      ]]
    }
  }
];

// Sample parcel boundaries
export const bentonParcelBoundaries: GeoJSONFeature[] = [
  {
    type: 'Feature',
    properties: {
      parcelId: '123456789012345',
      owner: 'John Doe',
      address: '123 Main St',
      acres: 1.5,
      zoning: 'Residential'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.238, 46.208],
        [-119.235, 46.208],
        [-119.235, 46.205],
        [-119.238, 46.205],
        [-119.238, 46.208]
      ]]
    }
  },
  {
    type: 'Feature',
    properties: {
      parcelId: '234567890123456',
      owner: 'Jane Smith',
      address: '456 Elm St',
      acres: 2.3,
      zoning: 'Commercial'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-119.115, 46.156],
        [-119.112, 46.156],
        [-119.112, 46.153],
        [-119.115, 46.153],
        [-119.115, 46.156]
      ]]
    }
  }
];