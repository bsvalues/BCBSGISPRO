import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportScheduler } from '@/components/reporting/report-scheduler';
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

describe('ReportScheduler Component', () => {
  const mockTemplates = [
    { id: 1, name: 'SM00 Report', description: 'Summary of workflow activities' },
    { id: 2, name: 'Parcel Changes Report', description: 'Tracks boundary adjustments and ownership changes' },
    { id: 3, name: 'Document Classification Report', description: 'Statistics on document types processed' }
  ];

  const mockSchedules = [
    { 
      id: 101, 
      templateId: 1, 
      templateName: 'SM00 Report',
      schedule: 'WEEKLY', 
      dayOfWeek: 1, // Monday
      hour: 8, 
      minute: 0,
      parameters: { 
        range: 'LAST_WEEK' 
      },
      active: true,
      recipients: ['admin@example.com']
    },
    { 
      id: 102, 
      templateId: 2, 
      templateName: 'Parcel Changes Report',
      schedule: 'MONTHLY', 
      dayOfMonth: 1, 
      hour: 9, 
      minute: 0,
      parameters: { 
        range: 'LAST_MONTH' 
      },
      active: true,
      recipients: ['admin@example.com', 'manager@example.com']
    }
  ];

  beforeEach(() => {
    // Setup default mock implementations
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      // Mock report templates data
      if (queryKey[0] === '/api/reports/templates') {
        return {
          data: mockTemplates,
          isLoading: false,
          error: null,
        };
      }
      
      // Mock report schedules data
      if (queryKey[0] === '/api/reports/schedules') {
        return {
          data: mockSchedules,
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

    // Mock mutation for creating/updating schedules
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      isPending: false,
    });
  });

  test('renders scheduled reports correctly', async () => {
    render(<ReportScheduler />);
    
    await waitFor(() => {
      expect(screen.getByText('Scheduled Reports')).toBeInTheDocument();
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
      expect(screen.getByText('Parcel Changes Report')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });
  });

  test('creates new report schedule', async () => {
    const mockCreateSchedule = jest.fn().mockResolvedValue({
      id: 103,
      templateId: 3,
      templateName: 'Document Classification Report',
      schedule: 'DAILY',
      hour: 7,
      minute: 30,
      parameters: {
        range: 'YESTERDAY'
      },
      active: true,
      recipients: ['admin@example.com']
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockCreateSchedule,
      isPending: false,
    });
    
    render(<ReportScheduler />);
    
    // Click create new schedule button
    fireEvent.click(screen.getByText('Create New Schedule'));
    
    // Select report template
    await waitFor(() => {
      expect(screen.getByText('Select Report Template')).toBeInTheDocument();
    });
    
    fireEvent.mouseDown(screen.getByLabelText('Report Template'));
    await waitFor(() => screen.getByText('Document Classification Report'));
    fireEvent.click(screen.getByText('Document Classification Report'));
    
    // Set frequency to Daily
    fireEvent.mouseDown(screen.getByLabelText('Frequency'));
    await waitFor(() => screen.getByText('Daily'));
    fireEvent.click(screen.getByText('Daily'));
    
    // Set time
    fireEvent.change(screen.getByLabelText('Hour'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Minute'), { target: { value: '30' } });
    
    // Set range parameter
    fireEvent.mouseDown(screen.getByLabelText('Time Range'));
    await waitFor(() => screen.getByText('Yesterday'));
    fireEvent.click(screen.getByText('Yesterday'));
    
    // Add email recipient
    fireEvent.change(screen.getByLabelText('Recipients'), { 
      target: { value: 'admin@example.com' } 
    });
    
    // Save schedule
    fireEvent.click(screen.getByText('Save Schedule'));
    
    // Verify that create schedule was called with correct params
    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith({
        templateId: 3,
        schedule: 'DAILY',
        hour: 7,
        minute: 30,
        parameters: {
          range: 'YESTERDAY'
        },
        recipients: ['admin@example.com'],
        active: true
      });
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Schedule created successfully')).toBeInTheDocument();
    });
  });

  test('edits existing report schedule', async () => {
    const mockUpdateSchedule = jest.fn().mockResolvedValue({
      id: 101,
      templateId: 1,
      templateName: 'SM00 Report',
      schedule: 'WEEKLY',
      dayOfWeek: 5, // Friday instead of Monday
      hour: 8,
      minute: 0,
      parameters: {
        range: 'LAST_WEEK'
      },
      active: true,
      recipients: ['admin@example.com', 'newemail@example.com']
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockUpdateSchedule,
      isPending: false,
    });
    
    render(<ReportScheduler />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    // Click edit button for first schedule
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for edit form to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Schedule')).toBeInTheDocument();
    });
    
    // Change day of week to Friday
    fireEvent.mouseDown(screen.getByLabelText('Day of Week'));
    await waitFor(() => screen.getByText('Friday'));
    fireEvent.click(screen.getByText('Friday'));
    
    // Add new recipient
    const recipientsInput = screen.getByLabelText('Recipients');
    fireEvent.change(recipientsInput, { 
      target: { value: recipientsInput.value + ', newemail@example.com' } 
    });
    
    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Verify that update schedule was called with correct params
    await waitFor(() => {
      expect(mockUpdateSchedule).toHaveBeenCalledWith({
        id: 101,
        templateId: 1,
        schedule: 'WEEKLY',
        dayOfWeek: 5,
        hour: 8,
        minute: 0,
        parameters: {
          range: 'LAST_WEEK'
        },
        recipients: ['admin@example.com', 'newemail@example.com'],
        active: true
      });
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Schedule updated successfully')).toBeInTheDocument();
    });
  });

  test('deletes report schedule', async () => {
    const mockDeleteSchedule = jest.fn().mockResolvedValue({ success: true });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockDeleteSchedule,
      isPending: false,
    });
    
    render(<ReportScheduler />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    // Click delete button for first schedule
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete this schedule?')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Confirm'));
    
    // Verify that delete schedule was called with correct ID
    await waitFor(() => {
      expect(mockDeleteSchedule).toHaveBeenCalledWith({ id: 101 });
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Schedule deleted successfully')).toBeInTheDocument();
    });
  });

  test('toggles schedule activation status', async () => {
    const mockToggleSchedule = jest.fn().mockResolvedValue({
      id: 101,
      active: false
    });
    
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockToggleSchedule,
      isPending: false,
    });
    
    render(<ReportScheduler />);
    
    // Wait for schedules to load
    await waitFor(() => {
      expect(screen.getByText('SM00 Report')).toBeInTheDocument();
    });
    
    // Click toggle switch for first schedule
    const toggleSwitches = screen.getAllByRole('switch');
    fireEvent.click(toggleSwitches[0]);
    
    // Verify that toggle was called with correct params
    await waitFor(() => {
      expect(mockToggleSchedule).toHaveBeenCalledWith({ 
        id: 101, 
        active: false 
      });
    });
  });

  test('validates required fields before submission', async () => {
    render(<ReportScheduler />);
    
    // Click create new schedule button
    fireEvent.click(screen.getByText('Create New Schedule'));
    
    // Try to save without filling required fields
    fireEvent.click(screen.getByText('Save Schedule'));
    
    // Verify validation error messages
    await waitFor(() => {
      expect(screen.getByText('Report template is required')).toBeInTheDocument();
      expect(screen.getByText('Frequency is required')).toBeInTheDocument();
      expect(screen.getByText('At least one recipient is required')).toBeInTheDocument();
    });
  });

  test('displays appropriate schedule parameters based on frequency', async () => {
    render(<ReportScheduler />);
    
    // Click create new schedule button
    fireEvent.click(screen.getByText('Create New Schedule'));
    
    // Select report template
    await waitFor(() => {
      expect(screen.getByLabelText('Report Template')).toBeInTheDocument();
    });
    
    // Select Weekly frequency
    fireEvent.mouseDown(screen.getByLabelText('Frequency'));
    await waitFor(() => screen.getByText('Weekly'));
    fireEvent.click(screen.getByText('Weekly'));
    
    // Verify weekly-specific field appears
    await waitFor(() => {
      expect(screen.getByLabelText('Day of Week')).toBeInTheDocument();
    });
    
    // Change to Monthly frequency
    fireEvent.mouseDown(screen.getByLabelText('Frequency'));
    await waitFor(() => screen.getByText('Monthly'));
    fireEvent.click(screen.getByText('Monthly'));
    
    // Verify monthly-specific field appears
    await waitFor(() => {
      expect(screen.getByLabelText('Day of Month')).toBeInTheDocument();
    });
  });
});