import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentParcelManager } from '@/components/documents/document-parcel-manager';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock query client
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Document-Parcel Relationship Management', () => {
  const mockDocument = {
    id: 1,
    name: 'Test Document.pdf',
    type: 'deed',
    contentType: 'application/pdf',
    workflowId: 123,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockParcels = [
    {
      id: 101,
      parcelNumber: '12345-67-89',
      address: '123 Main St',
      owner: 'John Doe',
      county: 'Benton',
      state: 'WA',
    },
    {
      id: 102,
      parcelNumber: '98765-43-21',
      address: '456 Oak Ave',
      owner: 'Jane Smith',
      county: 'Benton',
      state: 'WA',
    },
    {
      id: 103,
      parcelNumber: '55555-55-55',
      address: '789 Pine Ln',
      owner: 'Bob Johnson',
      county: 'Benton',
      state: 'WA',
    }
  ];

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock query responses
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: mockParcels.slice(0, 1), // Document is linked to the first parcel
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === '/api/parcels') {
        return {
          data: mockParcels,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    // Mock mutations
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  test('should display currently linked parcels', async () => {
    render(<DocumentParcelManager document={mockDocument} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Linked Parcels/i)).toBeInTheDocument();
      expect(screen.getByText('12345-67-89')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  test('should allow searching for parcels', async () => {
    // Mock search mutation
    const searchMock = jest.fn().mockResolvedValue([
      mockParcels[2], // Returning the third parcel as search result
    ]);
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: searchMock,
      isPending: false,
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Find search input and perform search
    const searchInput = screen.getByPlaceholderText(/Search parcels/i);
    fireEvent.change(searchInput, { target: { value: '789 Pine' } });
    fireEvent.click(screen.getByText(/Search/i));
    
    // Check if search results are displayed
    await waitFor(() => {
      expect(screen.getByText('789 Pine Ln')).toBeInTheDocument();
      expect(screen.getByText('55555-55-55')).toBeInTheDocument();
    });
  });

  test('should allow linking and unlinking parcels', async () => {
    const linkMutationMock = jest.fn().mockResolvedValue({});
    const unlinkMutationMock = jest.fn().mockResolvedValue({});
    
    (useMutation as jest.Mock).mockImplementation(({ mutationFn }) => {
      // Different mocks based on the mutation type
      if (mutationFn && mutationFn.toString().includes('link')) {
        return {
          mutateAsync: linkMutationMock,
          isPending: false,
        };
      } else {
        return {
          mutateAsync: unlinkMutationMock,
          isPending: false,
        };
      }
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Check linked parcels initially
    await waitFor(() => {
      expect(screen.getByText('12345-67-89')).toBeInTheDocument();
    });
    
    // Unlink parcel
    fireEvent.click(screen.getByText(/Unlink/i));
    
    // Confirm unlink
    await waitFor(() => {
      expect(unlinkMutationMock).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
    
    // Simulate new parcel search results after query invalidation
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: [], // Document now has no linked parcels
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === '/api/parcels') {
        return {
          data: mockParcels,
          isLoading: false,
          error: null,
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null,
      };
    });
    
    // Now link a new parcel (first we need to search)
    const searchMock = jest.fn().mockResolvedValue([mockParcels[1]]);
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: searchMock,
      isPending: false,
    });
    
    // Search for a parcel
    const searchInput = screen.getByPlaceholderText(/Search parcels/i);
    fireEvent.change(searchInput, { target: { value: 'Oak' } });
    fireEvent.click(screen.getByText(/Search/i));
    
    // Link a parcel from search results
    await waitFor(() => {
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    });
    
    // Reset mutation mock for linking
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: linkMutationMock,
      isPending: false,
    });
    
    // Click link button
    fireEvent.click(screen.getByText(/Link/i));
    
    // Verify link was called
    await waitFor(() => {
      expect(linkMutationMock).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });

  test('should handle bulk linking operations', async () => {
    const bulkLinkMutationMock = jest.fn().mockResolvedValue({});
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: bulkLinkMutationMock,
      isPending: false,
    });
    
    // Mock search returning multiple parcels
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === `/api/documents/${mockDocument.id}/parcels`) {
        return {
          data: [],
          isLoading: false,
          error: null,
        };
      } else if (queryKey[0] === '/api/parcels/search') {
        return {
          data: mockParcels.slice(1), // Return parcels 2 and 3
          isLoading: false,
          error: null,
        };
      }
      return {
        data: mockParcels,
        isLoading: false,
        error: null,
      };
    });
    
    render(<DocumentParcelManager document={mockDocument} />);
    
    // Trigger search
    fireEvent.click(screen.getByText(/Advanced Search/i));
    
    // Select multiple parcels from results (simulate checkboxes)
    await waitFor(() => {
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('789 Pine Ln')).toBeInTheDocument();
    });
    
    // Select both parcels (find checkboxes)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    
    // Click bulk link button
    fireEvent.click(screen.getByText(/Link Selected/i));
    
    // Verify bulk link mutation was called with both parcel IDs
    await waitFor(() => {
      expect(bulkLinkMutationMock).toHaveBeenCalledWith({
        documentId: mockDocument.id,
        parcelIds: [102, 103],
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});