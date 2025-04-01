/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as turf from '@turf/turf';
import { MeasurementTool, MeasurementType } from '../../client/src/components/maps/measurement-tool';
import { LayerFilter } from '../../client/src/components/maps/layer-filter';
import { BasemapSelector } from '../../client/src/components/maps/basemap-selector';
import { 
  calculateDistance,
  calculateArea,
  calculatePerimeter,
  getBaseMapUrl,
  filterLayersByProperty
} from '../../client/src/lib/map-utils';

// Mock data
const testPoints = [
  [46.2087, -119.1360],
  [46.2187, -119.1360],
  [46.2187, -119.1460],
  [46.2087, -119.1460],
  [46.2087, -119.1360]
];

const testLayers = [
  { id: 1, name: 'Residential Parcels', visible: true, properties: { type: 'Residential' } },
  { id: 2, name: 'Commercial Parcels', visible: true, properties: { type: 'Commercial' } },
  { id: 3, name: 'Agricultural Parcels', visible: true, properties: { type: 'Agricultural' } }
];

// Setup test client
const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// Utility function tests
describe('Map Measurement Utilities', () => {
  test('should calculate distance between two points correctly', () => {
    const point1 = [46.2087, -119.1360];
    const point2 = [46.2187, -119.1460];
    
    const distance = calculateDistance(point1, point2);
    
    // Distance should be approximately 1.4km (allowing for some calculation variance)
    expect(distance).toBeGreaterThan(1300);
    expect(distance).toBeLessThan(1500);
  });

  test('should calculate area of polygon correctly', () => {
    const polygon = turf.polygon([testPoints]);
    const area = calculateArea(polygon);
    
    // Area should be approximately 1.1 sq km
    expect(area).toBeGreaterThan(1000000);
    expect(area).toBeLessThan(1200000);
  });

  test('should calculate perimeter of polygon correctly', () => {
    const polygon = turf.polygon([testPoints]);
    const perimeter = calculatePerimeter(polygon);
    
    // Perimeter should be approximately 4.2km
    expect(perimeter).toBeGreaterThan(4000);
    expect(perimeter).toBeLessThan(4500);
  });
});

// Component tests
describe('MeasurementTool Component', () => {
  test('should render distance measurement tool', () => {
    render(<MeasurementTool type={MeasurementType.DISTANCE} onComplete={jest.fn()} />, { wrapper });
    
    expect(screen.getByText(/Distance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
  });

  test('should render area measurement tool', () => {
    render(<MeasurementTool type={MeasurementType.AREA} onComplete={jest.fn()} />, { wrapper });
    
    expect(screen.getByText(/Area/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
  });

  test('should call onComplete callback when measurement finishes', () => {
    const handleComplete = jest.fn();
    render(<MeasurementTool type={MeasurementType.DISTANCE} onComplete={handleComplete} />, { wrapper });
    
    // Simulate starting measurement
    fireEvent.click(screen.getByRole('button', { name: /Start/i }));
    
    // Simulate completing measurement (this is simplified - in reality would involve map clicks)
    // For this test we're just verifying the structure works
    fireEvent.click(screen.getByRole('button', { name: /Finish/i }));
    
    expect(handleComplete).toHaveBeenCalled();
  });
});

describe('BasemapSelector Component', () => {
  test('should render all basemap options', () => {
    render(<BasemapSelector onSelect={jest.fn()} />, { wrapper });
    
    expect(screen.getByText(/Street/i)).toBeInTheDocument();
    expect(screen.getByText(/Satellite/i)).toBeInTheDocument();
    expect(screen.getByText(/Topographic/i)).toBeInTheDocument();
  });

  test('should call onSelect with correct basemap URL when selected', () => {
    const handleSelect = jest.fn();
    render(<BasemapSelector onSelect={handleSelect} />, { wrapper });
    
    fireEvent.click(screen.getByText(/Satellite/i));
    
    expect(handleSelect).toHaveBeenCalledWith(expect.stringContaining('World_Imagery'));
  });

  test('getBaseMapUrl should return correct URL for each type', () => {
    expect(getBaseMapUrl('street')).toContain('openstreetmap');
    expect(getBaseMapUrl('satellite')).toContain('World_Imagery');
    expect(getBaseMapUrl('topo')).toContain('opentopomap');
  });
});

describe('LayerFilter Component', () => {
  test('should render property type filters', () => {
    render(<LayerFilter layers={testLayers} onFilterChange={jest.fn()} />, { wrapper });
    
    expect(screen.getByLabelText(/Residential/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Commercial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Agricultural/i)).toBeInTheDocument();
  });

  test('should call onFilterChange when filter is changed', () => {
    const handleFilterChange = jest.fn();
    render(<LayerFilter layers={testLayers} onFilterChange={handleFilterChange} />, { wrapper });
    
    fireEvent.click(screen.getByLabelText(/Residential/i));
    
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ type: 'Residential' })])
    );
  });

  test('filterLayersByProperty should return correct filtered layers', () => {
    const filtered = filterLayersByProperty(testLayers, 'type', 'Residential');
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].properties.type).toBe('Residential');
  });
});