// Import illustrations
import mapHelpSvg from '../assets/illustrations/map-help.svg';
import documentHelpSvg from '../assets/illustrations/document-help.svg';
import reportHelpSvg from '../assets/illustrations/report-help.svg';
import workflowHelpSvg from '../assets/illustrations/workflow-help.svg';

// Organize illustrations by category
export const illustrations = {
  map: {
    general: mapHelpSvg,
  },
  document: {
    general: documentHelpSvg,
  },
  report: {
    general: reportHelpSvg,
    generator: reportHelpSvg,
    schedule: reportHelpSvg,
    export: reportHelpSvg,
    viewer: reportHelpSvg,
  },
  workflow: {
    general: workflowHelpSvg,
  },
};