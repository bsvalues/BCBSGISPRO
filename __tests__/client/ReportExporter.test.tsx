import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportExporter } from '@/components/reporting/report-exporter';
import { useMutation } from '@tanstack/react-query';

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
}));

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

describe('ReportExporter Component', () => {
  const mockReport = {
    id: 123,
    name: 'Test Report',
    createdAt: new Date().toISOString(),
    templateId: 1,
    templateName: 'SM00 Report',
    status: 'completed'
  };

  beforeEach(() => {
    // Mock export mutations
    const mockExportMutation = jest.fn().mockImplementation(({ format }) => {
      return Promise.resolve({
        downloadUrl: `/api/reports/${mockReport.id}/export/${format}`,
        filename: `${mockReport.name}.${format}`
      });
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockExportMutation,
      isPending: false,
    });
  });

  test('renders export options correctly', () => {
    render(<ReportExporter report={mockReport} />);
    
    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  test('exports report as PDF', async () => {
    // Create a spy for window.open
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<ReportExporter report={mockReport} />);
    
    // Click PDF export button
    fireEvent.click(screen.getByText('PDF'));
    
    // Wait for export to complete
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        `/api/reports/${mockReport.id}/export/pdf`,
        '_blank'
      );
    });
    
    // Restore the spy
    openSpy.mockRestore();
  });

  test('exports report as Excel', async () => {
    // Create a spy for window.open
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<ReportExporter report={mockReport} />);
    
    // Click Excel export button
    fireEvent.click(screen.getByText('Excel'));
    
    // Wait for export to complete
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        `/api/reports/${mockReport.id}/export/xlsx`,
        '_blank'
      );
    });
    
    // Restore the spy
    openSpy.mockRestore();
  });

  test('exports report as CSV', async () => {
    // Create a spy for window.open
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<ReportExporter report={mockReport} />);
    
    // Click CSV export button
    fireEvent.click(screen.getByText('CSV'));
    
    // Wait for export to complete
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        `/api/reports/${mockReport.id}/export/csv`,
        '_blank'
      );
    });
    
    // Restore the spy
    openSpy.mockRestore();
  });

  test('exports report as HTML', async () => {
    // Create a spy for window.open
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<ReportExporter report={mockReport} />);
    
    // Click HTML export button
    fireEvent.click(screen.getByText('HTML'));
    
    // Wait for export to complete
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        `/api/reports/${mockReport.id}/export/html`,
        '_blank'
      );
    });
    
    // Restore the spy
    openSpy.mockRestore();
  });

  test('handles export errors gracefully', async () => {
    // Mock error in export
    const mockErrorMutation = jest.fn().mockRejectedValue(new Error('Export failed'));
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockErrorMutation,
      isPending: false,
    });
    
    render(<ReportExporter report={mockReport} />);
    
    // Click PDF export button
    fireEvent.click(screen.getByText('PDF'));
    
    // Verify error message displayed
    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  test('shows loading state during export', async () => {
    // Mock a slow export
    const mockSlowExport = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            downloadUrl: `/api/reports/${mockReport.id}/export/pdf`,
            filename: `${mockReport.name}.pdf`
          });
        }, 100);
      });
    });
    
    // Set up the mutation with isPending state management
    let setIsPending: (value: boolean) => void;
    (useMutation as jest.Mock).mockImplementation(() => {
      const [isPending, _setIsPending] = React.useState(false);
      setIsPending = _setIsPending;
      
      return {
        mutateAsync: async (...args: any[]) => {
          setIsPending(true);
          try {
            return await mockSlowExport(...args);
          } finally {
            setIsPending(false);
          }
        },
        isPending
      };
    });
    
    render(<ReportExporter report={mockReport} />);
    
    // Click PDF export button
    fireEvent.click(screen.getByText('PDF'));
    
    // Set isPending to true to simulate loading state
    setIsPending(true);
    
    // Verify loading indicator is shown
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
    
    // Finish the export
    setIsPending(false);
    
    // Verify loading is gone
    await waitFor(() => {
      expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
    });
  });
});