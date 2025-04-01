import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportGenerator } from '@/components/reporting/report-generator';
import { useQuery, useMutation } from '@tanstack/react-query';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

describe('ReportGenerator Component', () => {
  beforeEach(() => {
    // Setup default mock implementations
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      // Mock report templates data
      if (queryKey[0] === '/api/reports/templates') {
        return {
          data: [
            { id: 1, name: 'SM00 Report', description: 'Summary of workflow activities' },
            { id: 2, name: 'Parcel Changes Report', description: 'Tracks boundary adjustments and ownership changes' },
            { id: 3, name: 'Document Classification Report', description: 'Statistics on document types processed' }
          ],
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

    // Mock generate report mutation
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ 
        id: 123, 
        name: 'Generated Report',
        createdAt: new Date().toISOString(),
        status: 'completed'
      }),
      isPending: false,
    });
  });

  test('renders report template options correctly', async () => {
    render(<ReportGenerator />);
    
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
      expect(screen.getByText('Parcel Changes Report')).toBeInTheDocument();
      expect(screen.getByText('Document Classification Report')).toBeInTheDocument();
    });
  });

  test('selects report template and displays parameters', async () => {
    render(<ReportGenerator />);
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    // Select a template
    fireEvent.click(screen.getByText('SM00 Report'));
    
    // Check that parameter form is displayed
    await waitFor(() => {
      expect(screen.getByText('Report Parameters')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });
  });

  test('generates report with valid parameters', async () => {
    // Mock specific mutation for this test
    const mockGenerateReport = jest.fn().mockResolvedValue({ 
      id: 123, 
      name: 'SM00 Report - 2023-01-01 to 2023-01-31',
      createdAt: new Date().toISOString(),
      status: 'completed'
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockGenerateReport,
      isPending: false,
    });
    
    render(<ReportGenerator />);
    
    // Wait for templates to load and select one
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('SM00 Report'));
    
    // Fill in parameters
    await waitFor(() => {
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Start Date'), { 
      target: { value: '2023-01-01' }
    });
    
    fireEvent.change(screen.getByLabelText('End Date'), { 
      target: { value: '2023-01-31' }
    });
    
    // Generate report
    fireEvent.click(screen.getByText('Generate Report'));
    
    // Verify report generation was called with correct params
    await waitFor(() => {
      expect(mockGenerateReport).toHaveBeenCalledWith({
        templateId: 1,
        parameters: {
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      });
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Report Generated Successfully')).toBeInTheDocument();
    });
  });

  test('shows validation errors for invalid parameters', async () => {
    render(<ReportGenerator />);
    
    // Wait for templates to load and select one
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('SM00 Report'));
    
    // Don't fill any parameters and try to generate
    await waitFor(() => {
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Generate Report'));
    
    // Verify validation error messages
    await waitFor(() => {
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
      expect(screen.getByText('End date is required')).toBeInTheDocument();
    });
  });

  test('displays preview of report before generation', async () => {
    render(<ReportGenerator />);
    
    // Wait for templates to load and select one
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('SM00 Report'));
    
    // Fill in parameters
    await waitFor(() => {
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Start Date'), { 
      target: { value: '2023-01-01' }
    });
    
    fireEvent.change(screen.getByLabelText('End Date'), { 
      target: { value: '2023-01-31' }
    });
    
    // Click preview button
    fireEvent.click(screen.getByText('Preview Report'));
    
    // Verify preview is shown
    await waitFor(() => {
      expect(screen.getByText('Report Preview')).toBeInTheDocument();
      expect(screen.getByText('SM00 Report - 2023-01-01 to 2023-01-31')).toBeInTheDocument();
    });
  });
});