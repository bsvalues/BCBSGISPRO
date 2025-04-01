import { GeoJSONFeature, GeoJSONFeatureCollection } from '@/lib/map-utils';
import { WorkflowType } from '@/lib/workflow-types';
import { Workflow, WorkflowState } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

/**
 * Service to integrate map functionality with workflow processes
 */
export class WorkflowMapIntegration {
  private workflowId: number;
  private workflowType: WorkflowType;
  private state: WorkflowState | null = null;

  constructor(workflow: Workflow) {
    this.workflowId = workflow.id;
    this.workflowType = workflow.type as WorkflowType;
  }

  /**
   * Get the workflow state to determine what map tools should be enabled
   */
  async loadState(): Promise<WorkflowState | null> {
    try {
      this.state = await queryClient.fetchQuery({
        queryKey: ['/api/workflows', this.workflowId, 'state'],
        queryFn: async ({ queryKey }) => {
          const response = await fetch(`${queryKey.join('/')}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch workflow state');
          }
          
          return response.json();
        }
      });
      
      return this.state;
    } catch (error) {
      console.error('Error loading workflow state:', error);
      return null;
    }
  }

  /**
   * Gets the map tools that should be enabled based on workflow type and state
   */
  getEnabledMapTools(): string[] {
    if (!this.state) {
      return ['pan', 'select'];
    }

    const { currentStep, status } = this.state;
    
    // If workflow is completed or archived, only allow viewing
    if (['completed', 'archived'].includes(status || '')) {
      return ['pan', 'select', 'measure'];
    }
    
    // Enable tools based on workflow type and current step
    switch (this.workflowType) {
      case 'long_plat':
        // Step 3 (Parcels) and 4 (Map) include drawing tools
        if (currentStep === 3 || currentStep === 4) {
          return ['pan', 'select', 'measure', 'draw', 'edit'];
        }
        return ['pan', 'select', 'measure'];
        
      case 'bla':
        // Step 3 (Boundaries) includes drawing tools
        if (currentStep === 3) {
          return ['pan', 'select', 'measure', 'draw', 'edit'];
        }
        return ['pan', 'select', 'measure'];
        
      case 'merge_split':
        // Step 3 (New Config) and 4 (Map) include drawing tools
        if (currentStep === 3 || currentStep === 4) {
          return ['pan', 'select', 'measure', 'draw', 'edit'];
        }
        return ['pan', 'select', 'measure'];
        
      // SM00 report doesn't involve drawing
      case 'sm00_report':
        return ['pan', 'select', 'measure'];
        
      default:
        return ['pan', 'select'];
    }
  }
  
  /**
   * Gets the relevant map layers for this workflow type
   */
  async getRelevantMapLayers(): Promise<string[]> {
    // Different workflow types might need different map layers
    switch (this.workflowType) {
      case 'long_plat':
        return ['Parcels', 'Zoning', 'Streets', 'Hydrology'];
        
      case 'bla':
        return ['Parcels', 'Property Lines', 'Streets'];
        
      case 'merge_split':
        return ['Parcels', 'Property Lines', 'Zoning'];
        
      case 'sm00_report':
        return ['Parcels', 'Administrative Boundaries'];
        
      default:
        return ['Parcels'];
    }
  }
  
  /**
   * Saves geometry data associated with the workflow
   */
  async saveWorkflowGeometry(feature: GeoJSONFeature | GeoJSONFeatureCollection): Promise<boolean> {
    try {
      const response = await fetch(`/api/workflows/${this.workflowId}/geometry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          geometry: feature,
          action: 'update',
          timestamp: new Date().toISOString()
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to save workflow geometry');
      }
      
      // Invalidate related queries to ensure data consistency
      await queryClient.invalidateQueries({
        queryKey: ['/api/workflows', this.workflowId]
      });
      
      return true;
    } catch (error) {
      console.error('Error saving workflow geometry:', error);
      return false;
    }
  }
  
  /**
   * Loads geometry data associated with the workflow
   */
  async loadWorkflowGeometry(): Promise<GeoJSONFeatureCollection | null> {
    try {
      const response = await fetch(`/api/workflows/${this.workflowId}/geometry`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load workflow geometry');
      }
      
      const data = await response.json();
      return data.geometry;
    } catch (error) {
      console.error('Error loading workflow geometry:', error);
      return null;
    }
  }

  /**
   * Computes the bounds that should be displayed on the map based on workflow data
   */
  async getWorkflowMapBounds(): Promise<[[number, number], [number, number]] | null> {
    try {
      const response = await fetch(`/api/workflows/${this.workflowId}/map-bounds`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get workflow map bounds');
      }
      
      const data = await response.json();
      return data.bounds;
    } catch (error) {
      console.error('Error getting workflow map bounds:', error);
      return null;
    }
  }
  
  /**
   * Gets parcels associated with this workflow
   */
  async getWorkflowParcels() {
    try {
      const parcels = await queryClient.fetchQuery({
        queryKey: ['/api/workflows', this.workflowId, 'parcels'],
        queryFn: async ({ queryKey }) => {
          const response = await fetch(`${queryKey.join('/')}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch workflow parcels');
          }
          
          return response.json();
        }
      });
      
      return parcels;
    } catch (error) {
      console.error('Error loading workflow parcels:', error);
      return [];
    }
  }
  
  /**
   * Tracks map interaction events related to this workflow
   */
  async logMapInteraction(action: string, details: any): Promise<void> {
    try {
      await fetch(`/api/workflows/${this.workflowId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'map_interaction',
          action,
          details,
          timestamp: new Date().toISOString()
        }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging map interaction:', error);
    }
  }
}

/**
 * Creates a workflow map integration service for a specific workflow
 */
export function createWorkflowMapIntegration(workflow: Workflow): WorkflowMapIntegration {
  return new WorkflowMapIntegration(workflow);
}

export default WorkflowMapIntegration;