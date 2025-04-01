import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchDocumentProcessor } from '@/components/documents/batch-document-processor';
import { useDocumentClassifier } from '@/hooks/use-document-classifier';
import { DocumentType } from '@shared/document-types';

// Mock the document classifier hook
jest.mock('@/hooks/use-document-classifier', () => ({
  useDocumentClassifier: jest.fn(),
}));

// Mock the queryClient
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
  apiRequest: jest.fn(),
}));

describe('BatchDocumentProcessor Component', () => {
  beforeEach(() => {
    // Setup default mock implementations
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn().mockResolvedValue({}),
      isUploading: false,
      isProcessing: false,
    });
  });

  test('should render upload area with drag-and-drop functionality', () => {
    render(<BatchDocumentProcessor workflowId={1} onComplete={jest.fn()} />);
    
    // Check if upload area is rendered
    expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  test('should display selected files in queue', async () => {
    // Mock file selection
    const file1 = new File(['test content'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test content'], 'test2.pdf', { type: 'application/pdf' });
    
    render(<BatchDocumentProcessor workflowId={1} onComplete={jest.fn()} />);
    
    // Get file input
    const input = screen.getByLabelText(/upload files/i);
    
    // Simulate file selection
    Object.defineProperty(input, 'files', {
      value: [file1, file2],
    });
    
    fireEvent.change(input);
    
    // Check if files are displayed in the queue
    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
  });

  test('should show progress for each document during upload', async () => {
    // Setup mock implementation for batch upload
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn().mockImplementation(() => {
        // Simulate delay for progress display
        return new Promise(resolve => setTimeout(() => resolve({
          document: { id: 1, name: 'test.pdf' },
          classification: { documentType: DocumentType.DEED, confidence: 0.8 }
        }), 100));
      }),
      isUploading: true,
      isProcessing: true,
    });
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<BatchDocumentProcessor workflowId={1} onComplete={jest.fn()} />);
    
    // Get file input and simulate file selection
    const input = screen.getByLabelText(/upload files/i);
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    
    // Trigger upload
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Check for progress indicator
    await waitFor(() => {
      expect(screen.getByText(/Processing/i)).toBeInTheDocument();
    });
  });

  test('should handle mixed success/failure results', async () => {
    // Mock success and failure for different files
    const successFile = new File(['success content'], 'success.pdf', { type: 'application/pdf' });
    const failureFile = new File(['failure content'], 'failure.pdf', { type: 'application/pdf' });
    
    let uploadCounter = 0;
    
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn().mockImplementation(() => {
        uploadCounter++;
        if (uploadCounter === 1) {
          // First call succeeds
          return Promise.resolve({
            document: { id: 1, name: 'success.pdf' },
            classification: { documentType: DocumentType.DEED, confidence: 0.8 }
          });
        } else {
          // Second call fails
          return Promise.reject(new Error('Upload failed'));
        }
      }),
      isUploading: false,
      isProcessing: false,
    });
    
    render(<BatchDocumentProcessor workflowId={1} onComplete={jest.fn()} />);
    
    // Get file input and simulate file selection
    const input = screen.getByLabelText(/upload files/i);
    Object.defineProperty(input, 'files', { value: [successFile, failureFile] });
    fireEvent.change(input);
    
    // Trigger upload
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Check for success and failure indicators
    await waitFor(() => {
      expect(screen.getByText(/success\.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/failure\.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    });
    
    // Check that retry button is available for failed upload
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
  });

  test('should classify documents automatically during batch processing', async () => {
    (useDocumentClassifier as jest.Mock).mockReturnValue({
      uploadWithClassification: jest.fn().mockResolvedValue({
        document: { id: 1, name: 'test.pdf' },
        classification: { 
          documentType: DocumentType.PLAT_MAP, 
          confidence: 0.9,
          documentTypeLabel: 'Plat Map'
        }
      }),
      isUploading: false,
      isProcessing: false,
    });
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    render(<BatchDocumentProcessor workflowId={1} onComplete={jest.fn()} />);
    
    // Get file input and simulate file selection
    const input = screen.getByLabelText(/upload files/i);
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    
    // Trigger upload
    fireEvent.click(screen.getByText(/Process Files/i));
    
    // Check for classification result
    await waitFor(() => {
      expect(screen.getByText(/Plat Map/i)).toBeInTheDocument();
      expect(screen.getByText(/90%/i)).toBeInTheDocument();
    });
  });
});