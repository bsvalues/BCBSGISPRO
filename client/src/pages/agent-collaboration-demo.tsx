/**
 * Agent Collaboration Demo Page
 * 
 * This page demonstrates the multi-agent collaboration capabilities
 * orchestrated by the Master Control Program (MCP).
 */

import React, { useState } from 'react';
import AgentInterface from '../components/agent-system/agent-interface';
import { AGENTS } from '../services/agent-collaboration-service';
import { Info, Users } from 'lucide-react';
import { useAgentSystem } from '../context/agent-system-context';
import { useAuth } from '../context/auth-context';
import { useToast } from '../hooks/use-toast';
import { check_secrets } from '../lib/api';

// Demo scenarios for agent collaboration
const DEMO_SCENARIOS = [
  {
    title: "Parcel Boundary Validation",
    description: "Analyze if a parcel's legal description matches its mapped boundary",
    query: "Can you help verify if the legal description for parcel #538903000045 matches its mapped boundary? I think there might be a discrepancy on the northeast corner."
  },
  {
    title: "Map Layer Recommendation",
    description: "Get recommendations for appropriate map layers for a specific task",
    query: "What map layers should I use when creating a floodplain analysis map for presentation to the county commissioners?"
  },
  {
    title: "Deed Cross-reference Verification",
    description: "Check if deed references are properly aligned with parcel records",
    query: "I need to verify that all the cross-references in deed #20250108-001234 properly align with the current parcel configuration after the recent boundary line adjustment."
  },
  {
    title: "Data Quality Assessment",
    description: "Evaluate data completeness and identify potential issues",
    query: "Can you analyze the completeness of our property classification data for tax year 2024? I'm particularly concerned about the commercial properties in the western district."
  }
];

const AgentCollaborationDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const { isAvailable } = useAgentSystem();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Check if Anthropic API key is configured
  const checkApiKey = async () => {
    try {
      const hasSecret = await check_secrets(['ANTHROPIC_API_KEY']);
      
      if (!hasSecret.ANTHROPIC_API_KEY) {
        toast({
          title: 'API Key Required',
          description: 'The Anthropic API key is required for agent collaboration. Please configure it in your environment.',
          variant: 'warning',
          duration: 8000
        });
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };
  
  // Check API key on page load
  React.useEffect(() => {
    if (!isAvailable) {
      checkApiKey();
    }
  }, [isAvailable]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Agent Collaboration System</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Experience multi-agent collaboration orchestrated by the Master Control Program (MCP),
          which intelligently routes requests and synthesizes responses from specialized agents.
        </p>
      </div>

      {/* Agent info section */}
      <div className="mb-8 border rounded-lg p-4 bg-muted/10">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Specialized Agents</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(AGENTS).filter(agent => agent.id !== 'master_control').map((agent) => (
            <div key={agent.id} className="border rounded-md p-4 bg-background">
              <h3 className="font-medium text-lg mb-1">{agent.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{agent.description}</p>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map((capability, index) => (
                  <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                    {capability}
                  </span>
                ))}
                {agent.capabilities.length > 3 && (
                  <span className="px-2 py-1 bg-muted rounded-md text-xs">
                    +{agent.capabilities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">How the Master Control Program (MCP) works</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                The MCP analyzes your question and routes it to the most appropriate specialized agent.
                It may also involve additional agents for complex questions, synthesizing their responses
                into a comprehensive answer. This provides you with expertise from multiple domains in a single,
                coherent response.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo scenarios section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Try these scenarios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEMO_SCENARIOS.map((scenario, index) => (
            <button
              key={index}
              className={`p-4 border rounded-lg text-left transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                selectedScenario === index ? 'border-primary bg-primary/10' : 'bg-card'
              }`}
              onClick={() => setSelectedScenario(index)}
            >
              <h3 className="font-medium mb-1">{scenario.title}</h3>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Agent interface */}
      <div className="mb-8">
        <AgentInterface
          defaultAgentId="master_control"
          contextData={
            user 
              ? `User: ${user.fullName || user.username} (ID: ${user.id})`
              : undefined
          }
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* How it works section */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-xl font-semibold mb-4">How Agent Collaboration Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-muted/10 p-4 rounded-lg">
            <div className="bg-primary/20 w-8 h-8 flex items-center justify-center rounded-full text-primary mb-3">1</div>
            <h3 className="font-medium mb-2">Query Analysis</h3>
            <p className="text-sm text-muted-foreground">
              The Master Control Program (MCP) analyzes your query to understand its intent and domain.
              It determines which specialized agent(s) are best equipped to respond.
            </p>
          </div>
          
          <div className="bg-muted/10 p-4 rounded-lg">
            <div className="bg-primary/20 w-8 h-8 flex items-center justify-center rounded-full text-primary mb-3">2</div>
            <h3 className="font-medium mb-2">Multi-Agent Processing</h3>
            <p className="text-sm text-muted-foreground">
              The primary agent processes the query in-depth. For complex queries, secondary agents
              contribute additional expertise and insights from their specialized domains.
            </p>
          </div>
          
          <div className="bg-muted/10 p-4 rounded-lg">
            <div className="bg-primary/20 w-8 h-8 flex items-center justify-center rounded-full text-primary mb-3">3</div>
            <h3 className="font-medium mb-2">Response Synthesis</h3>
            <p className="text-sm text-muted-foreground">
              The MCP synthesizes all agent contributions into a comprehensive, coherent response that
              addresses all aspects of your query with specialized expertise from multiple domains.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCollaborationDemo;