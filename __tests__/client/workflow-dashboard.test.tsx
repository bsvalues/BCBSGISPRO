import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { WorkflowDashboard } from '@/components/workflow/workflow-dashboard';
import { Workflow } from '@shared/schema';

// Mock the hooks and API calls
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isLoading: false
  })
}));

const mockWorkflows: Workflow[] = [
  {
    id: 1,
    userId: 1,
    type: 'long_plat',
    title: 'Test Long Plat 1',
    description: 'High priority workflow',
    status: 'in_progress',
    priority: 'high',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-05').toISOString()
  },
  {
    id: 2,
    userId: 1,
    type: 'bla',
    title: 'Test BLA 1',
    description: 'Medium priority workflow',
    status: 'review',
    priority: 'medium',
    createdAt: new Date('2025-01-02').toISOString(),
    updatedAt: new Date('2025-01-04').toISOString()
  },
  {
    id: 3,
    userId: 1,
    type: 'merge_split',
    title: 'Test Merge Split',
    description: 'Low priority workflow',
    status: 'completed',
    priority: 'low',
    createdAt: new Date('2025-01-03').toISOString(),
    updatedAt: new Date('2025-01-06').toISOString()
  }
];

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === '/api/workflows') {
      return {
        data: mockWorkflows,
        isLoading: false,
        error: null
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null
    };
  })
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('WorkflowDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render workflow dashboard with all workflows', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
  });

  test('should filter workflows by status', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Initial render should show all workflows
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
    
    // Filter by In Progress
    const inProgressFilter = screen.getByRole('button', { name: /in progress/i });
    fireEvent.click(inProgressFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.queryByText('Test BLA 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });

  test('should filter workflows by priority', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Initial render should show all workflows
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
    
    // Filter by High Priority
    const highPriorityFilter = screen.getByRole('button', { name: /high priority/i });
    fireEvent.click(highPriorityFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.queryByText('Test BLA 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });

  test('should highlight high priority workflows', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    await waitFor(() => {
      const highPriorityWorkflow = screen.getByText('Test Long Plat 1').closest('.workflow-item');
      expect(highPriorityWorkflow).toHaveClass('priority-high');
    });
  });

  test('should display workflow timeline', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Click on a workflow to view details with timeline
    const workflowTitle = screen.getByText('Test Long Plat 1');
    fireEvent.click(workflowTitle);
    
    await waitFor(() => {
      expect(screen.getByText('Workflow Timeline')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('Jan 5, 2025')).toBeInTheDocument();
    });
  });
});