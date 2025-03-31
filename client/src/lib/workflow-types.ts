export type WorkflowStep = {
  id: number;
  name: string;
  description?: string;
};

export type WorkflowType = 'long_plat' | 'bla' | 'merge_split' | 'sm00_report';

export const workflowTypeLabels: Record<WorkflowType, string> = {
  long_plat: 'Process Long Plat',
  bla: 'Execute BLA',
  merge_split: 'Merge/Split Parcels',
  sm00_report: 'Generate SM00 Report'
};

export const workflowTypeDescriptions: Record<WorkflowType, string> = {
  long_plat: 'Create and process a new long plat in Benton County',
  bla: 'Execute a Boundary Line Adjustment between parcels',
  merge_split: 'Process parcel merges and splits',
  sm00_report: 'Generate monthly segregation reports'
};

export const workflowTypeIcons: Record<WorkflowType, string> = {
  long_plat: 'map-marked-alt',
  bla: 'object-group',
  merge_split: 'exchange-alt',
  sm00_report: 'file-alt'
};

export const workflowSteps: Record<WorkflowType, WorkflowStep[]> = {
  long_plat: [
    { id: 1, name: 'Basic Info', description: 'Enter general plat information' },
    { id: 2, name: 'Documents', description: 'Upload and review required documents' },
    { id: 3, name: 'Parcels', description: 'Define new parcels and generate IDs' },
    { id: 4, name: 'Map', description: 'Review and update GIS map information' },
    { id: 5, name: 'Review', description: 'Final review and submission' }
  ],
  bla: [
    { id: 1, name: 'Initial Info', description: 'Enter basic BLA information' },
    { id: 2, name: 'Documents', description: 'Upload required BLA documents' },
    { id: 3, name: 'Boundaries', description: 'Define new boundaries' },
    { id: 4, name: 'Review', description: 'Final review and approval' }
  ],
  merge_split: [
    { id: 1, name: 'Selection', description: 'Select parcels to merge or split' },
    { id: 2, name: 'Documents', description: 'Upload deed documents' },
    { id: 3, name: 'New Config', description: 'Define new configuration' },
    { id: 4, name: 'Map', description: 'Review map changes' },
    { id: 5, name: 'Submit', description: 'Complete and submit changes' }
  ],
  sm00_report: [
    { id: 1, name: 'Parameters', description: 'Set report parameters' },
    { id: 2, name: 'Data', description: 'Review data to be included' },
    { id: 3, name: 'Generate', description: 'Generate and distribute report' }
  ]
};
