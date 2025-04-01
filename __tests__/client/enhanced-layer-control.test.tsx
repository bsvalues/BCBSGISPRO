import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedLayerControl } from '@/components/maps/enhanced-layer-control';
import { MapLayer } from '@shared/schema';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API calls
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
    useMutation: jest.fn(() => ({
      mutate: jest.fn(),
      isPending: false,
    })),
  };
});

// Mock data for tests
const mockLayers: MapLayer[] = [
  {
    id: 1,
    name: 'Parcels',
    type: 'vector',
    source: 'county',
    metadata: { description: 'County parcel boundaries', year: 2024 },
    opacity: 1,
    order: 1,
    visible: true,
    zindex: 10
  },
  {
    id: 2,
    name: 'Zoning',
    type: 'vector',
    source: 'county',
    metadata: { description: 'Zoning districts', year: 2023 },
    opacity: 0.8,
    order: 2,
    visible: true,
    zindex: 5
  },
  {
    id: 3,
    name: 'Aerial Imagery',
    type: 'raster',
    source: 'state',
    metadata: { description: 'Aerial photos', year: 2022 },
    opacity: 1,
    order: 0,
    visible: false,
    zindex: 1
  }
];

const queryClient = new QueryClient();

// Wrapper component for providing context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Enhanced Layer Control', () => {
  beforeEach(() => {
    // Mock the query response
    (useQuery as jest.Mock).mockReturnValue({
      data: mockLayers,
      isLoading: false,
      error: null,
    });
    
    // Mock the mutation
    (useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should display all available map layers', async () => {
    render(<EnhancedLayerControl />, { wrapper });
    
    // Check if all layers are displayed
    await waitFor(() => {
      expect(screen.getByText('Parcels')).toBeInTheDocument();
      expect(screen.getByText('Zoning')).toBeInTheDocument();
      expect(screen.getByText('Aerial Imagery')).toBeInTheDocument();
    });
  });

  test('should toggle layer visibility when checkbox is clicked', async () => {
    const mockMutate = jest.fn();
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<EnhancedLayerControl />, { wrapper });
    
    // Find the visibility toggle for the first layer
    const visibilityCheckbox = screen.getAllByRole('checkbox')[0];
    
    // Toggle visibility
    fireEvent.click(visibilityCheckbox);
    
    // Verify mutation was called with correct parameters
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        updates: expect.objectContaining({
          visible: false, // Toggling from true to false
        }),
      })
    );
  });

  test('should adjust layer opacity with slider control', async () => {
    const mockMutate = jest.fn();
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<EnhancedLayerControl />, { wrapper });
    
    // Find the opacity slider for the first layer
    const opacitySlider = screen.getAllByRole('slider')[0];
    
    // Change opacity
    fireEvent.change(opacitySlider, { target: { value: 0.5 } });
    
    // Verify mutation was called with correct parameters
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        updates: expect.objectContaining({
          opacity: 0.5,
        }),
      })
    );
  });

  test('should allow reordering layers', async () => {
    const mockMutate = jest.fn();
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    render(<EnhancedLayerControl />, { wrapper });
    
    // Find the move up button for the second layer
    const moveUpButton = screen.getAllByLabelText('Move layer up')[1];
    
    // Click to move up
    fireEvent.click(moveUpButton);
    
    // Verify mutations were called to update both affected layers
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(Number),
        updates: expect.objectContaining({
          order: expect.any(Number),
        }),
      })
    );
  });

  test('should filter layers based on type selection', async () => {
    render(<EnhancedLayerControl />, { wrapper });
    
    // Select the vector filter
    const vectorFilter = screen.getByLabelText('Vector layers');
    fireEvent.click(vectorFilter);
    
    // Verify only vector layers are visible
    await waitFor(() => {
      expect(screen.getByText('Parcels')).toBeInTheDocument();
      expect(screen.getByText('Zoning')).toBeInTheDocument();
      expect(screen.queryByText('Aerial Imagery')).not.toBeVisible();
    });
  });

  test('should display loading state when data is loading', async () => {
    // Mock loading state
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    render(<EnhancedLayerControl />, { wrapper });
    
    // Check for loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('should display error state when query fails', async () => {
    // Mock error state
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load map layers'),
    });
    
    render(<EnhancedLayerControl />, { wrapper });
    
    // Check for error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});