/**
 * Agents Index
 * 
 * This module exports all agents for the agent architecture.
 */

import { dataValidationAgent } from './data-validation-agent';
import { legalComplianceAgent } from './legal-compliance-agent';
import { mapIntelligenceAgent } from './map-intelligence-agent';

/**
 * Register agents with the Master Control Program
 */
export const registerAgents = (mcp: any): void => {
  // Register the Data Validation Agent
  mcp.registry.registerAgent(dataValidationAgent);
  
  // Register the Legal Compliance Agent
  mcp.registry.registerAgent(legalComplianceAgent);
  
  // Register the Map Intelligence Agent
  mcp.registry.registerAgent(mapIntelligenceAgent);
  
  // Additional agents will be registered as they are implemented
};

export { dataValidationAgent, legalComplianceAgent, mapIntelligenceAgent };