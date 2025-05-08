/**
 * Agent System Context
 * 
 * This context provides access to the AI agent system throughout the application,
 * managing agent state, requests, and responses.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWebSocketContext } from './websocket-context';
import { useToast } from '../hooks/use-toast';
import { useCurrentUser } from '../hooks/use-current-user';

// Agent types available in the system
export type AgentType = 'master_control' | 'data_validation' | 'legal_compliance' | 'map_intelligence';

// Agent response interface
export interface AgentResponse {
  requestId: string;
  agentId: string;
  response: string;
  userId: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Agent system context interface
interface AgentSystemContextProps {
  isAvailable: boolean;
  isProcessing: boolean;
  activeAgents: AgentType[];
  lastResponse: AgentResponse | null;
  responses: Record<string, AgentResponse>;
  requestAgentAssistance: (agentId: string, query: string, context?: string, tools?: string[]) => string | null;
  clearResponses: () => void;
}

// Create context with default values
const AgentSystemContext = createContext<AgentSystemContextProps>({
  isAvailable: false,
  isProcessing: false,
  activeAgents: [],
  lastResponse: null,
  responses: {},
  requestAgentAssistance: () => null,
  clearResponses: () => {}
});

// Hook to use the agent system context
export const useAgentSystem = () => useContext(AgentSystemContext);

export const AgentSystemProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Get WebSocket context
  const { isConnected, sendMessage, addMessageListener } = useWebSocketContext();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  
  // State
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<AgentType[]>([
    'master_control',
    'data_validation',
    'legal_compliance',
    'map_intelligence'
  ]);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [responses, setResponses] = useState<Record<string, AgentResponse>>({});
  
  // Generate a unique request ID
  const generateRequestId = useCallback(() => {
    return `req_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  }, []);
  
  // Request assistance from an agent
  const requestAgentAssistance = useCallback((
    agentId: string, 
    query: string, 
    context?: string,
    tools?: string[]
  ) => {
    if (!isConnected || !user?.id) {
      toast({
        title: 'Connection Error',
        description: 'Cannot connect to agent system. Please try again later.',
        variant: 'destructive'
      });
      return null;
    }
    
    // Generate request ID
    const requestId = generateRequestId();
    
    // Set processing state
    setIsProcessing(true);
    
    // Send request over WebSocket
    sendMessage({
      type: 'agent_request',
      userId: user.id,
      agentId,
      content: {
        requestId,
        query,
        context,
        userId: user.id,
        agentId,
        tools
      }
    });
    
    return requestId;
  }, [isConnected, generateRequestId, sendMessage, user, toast]);
  
  // Clear all stored responses
  const clearResponses = useCallback(() => {
    setResponses({});
    setLastResponse(null);
  }, []);
  
  // Process WebSocket messages related to agent responses
  const handleAgentMessage = useCallback((data: any) => {
    if (data.type === 'agent_response' && data.content) {
      const response = data.content as AgentResponse;
      
      // Store response
      setResponses(prev => ({
        ...prev,
        [response.requestId]: response
      }));
      
      // Set as last response
      setLastResponse(response);
      
      // Reset processing state
      setIsProcessing(false);
    }
    else if (data.type === 'agent_status') {
      if (data.content?.step === 'error') {
        // Show error notification
        toast({
          title: 'Agent Error',
          description: data.content.message || 'An error occurred with the agent',
          variant: 'destructive'
        });
        
        // Reset processing state if error
        setIsProcessing(false);
      }
    }
    else if (data.type === 'agent_system_status') {
      // Update agent system availability
      setIsAvailable(data.content?.available || false);
      
      // Update active agents if provided
      if (data.content?.activeAgents) {
        setActiveAgents(data.content.activeAgents);
      }
    }
  }, [toast]);
  
  // Add WebSocket message listener
  useEffect(() => {
    if (isConnected) {
      const cleanup = addMessageListener(handleAgentMessage);
      
      // Request initial agent system status
      sendMessage({
        type: 'agent_system_status_request',
        userId: user?.id || 0
      });
      
      return cleanup;
    }
    
    return () => {};
  }, [isConnected, addMessageListener, handleAgentMessage, sendMessage, user]);
  
  // Check if Anthropic API key is available
  useEffect(() => {
    const checkApiKey = async () => {
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        toast({
          title: 'API Key Missing',
          description: 'Anthropic API key is not configured. Agent capabilities will be limited.',
          variant: 'warning',
          duration: 8000
        });
        
        setIsAvailable(false);
      } else {
        setIsAvailable(true);
      }
    };
    
    checkApiKey();
  }, [toast]);
  
  // Context value
  const value = {
    isAvailable,
    isProcessing,
    activeAgents,
    lastResponse,
    responses,
    requestAgentAssistance,
    clearResponses
  };
  
  return (
    <AgentSystemContext.Provider value={value}>
      {children}
    </AgentSystemContext.Provider>
  );
};

export default AgentSystemContext;