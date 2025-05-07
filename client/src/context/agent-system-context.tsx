/**
 * AI Agent System Context
 * 
 * This context provides application-wide access to the AI agent system,
 * allowing components to interact with various AI agents via WebSocket.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocketContext } from './websocket-context';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

// Types for agent interactions
export interface AgentRequest {
  query: string;
  context?: string;
  agentId: string;
  requestId: string;
  tools?: string[];
}

export interface AgentResponse {
  response: string;
  requestId: string;
  agentId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Agent types
export type AgentType = 
  | 'data_validation' 
  | 'legal_compliance' 
  | 'map_intelligence' 
  | 'master_control';

// Context interface
interface AgentSystemContextValue {
  // Request handling
  requestAgentAssistance: (
    agentType: AgentType, 
    query: string, 
    context?: string,
    tools?: string[]
  ) => string | null;
  
  // Response handling
  lastResponse: AgentResponse | null;
  responses: Map<string, AgentResponse>;
  clearResponses: () => void;
  
  // Agent system state
  isProcessing: boolean;
  isAvailable: boolean;
  
  // Active agent tracking
  activeAgents: AgentType[];
}

// Create context with default values
const AgentSystemContext = createContext<AgentSystemContextValue | null>(null);

// Props for the provider component
interface AgentSystemProviderProps {
  children: React.ReactNode;
}

// Provider component
export const AgentSystemProvider: React.FC<AgentSystemProviderProps> = ({ children }) => {
  const { isConnected, sendMessage, addMessageListener } = useWebSocketContext();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  
  // State
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [responses, setResponses] = useState<Map<string, AgentResponse>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<AgentType[]>([]);
  
  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `req_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  }, []);
  
  // Check if agent system is available
  const isAvailable = useMemo(() => {
    return isConnected && !isProcessing && !!user?.id;
  }, [isConnected, isProcessing, user]);
  
  // Send a request to an AI agent
  const requestAgentAssistance = useCallback((
    agentType: AgentType,
    query: string,
    context?: string,
    tools?: string[]
  ) => {
    if (!isConnected || !user?.id) {
      toast({
        title: 'Connection Error',
        description: 'Cannot connect to agent system. Please try again later.',
        variant: 'destructive',
        duration: 5000
      });
      return null;
    }
    
    // Create request object
    const requestId = generateRequestId();
    const request: AgentRequest = {
      query,
      context,
      agentId: agentType,
      requestId,
      tools
    };
    
    // Send request over WebSocket
    sendMessage({
      type: 'agent_request',
      content: {
        ...request,
        userId: user.id
      }
    });
    
    // Update processing state
    setIsProcessing(true);
    
    // Show toast notification
    toast({
      title: `${agentType.replace('_', ' ')} Agent`,
      description: 'Processing your request...',
      variant: 'default',
      duration: 3000
    });
    
    return requestId;
  }, [isConnected, user, generateRequestId, sendMessage, toast]);
  
  // Handle agent responses
  const handleAgentMessage = useCallback((data: any) => {
    // Only process agent responses
    if (data.type !== 'agent_response' || !data.content) return;
    
    const response = data.content as AgentResponse;
    
    // Update processing state
    setIsProcessing(false);
    
    // Update response state
    setLastResponse(response);
    setResponses(prev => {
      const newMap = new Map(prev);
      newMap.set(response.requestId, response);
      return newMap;
    });
    
    // Show toast for response received
    toast({
      title: `${response.agentId.replace('_', ' ')} Agent`,
      description: 'Response received',
      variant: 'success',
      duration: 3000
    });
  }, [toast]);
  
  // Clear responses
  const clearResponses = useCallback(() => {
    setResponses(new Map());
    setLastResponse(null);
  }, []);
  
  // Setup WebSocket message listener
  useEffect(() => {
    const cleanup = addMessageListener(handleAgentMessage);
    return cleanup;
  }, [addMessageListener, handleAgentMessage]);
  
  // Discover active agents
  useEffect(() => {
    if (isConnected) {
      // Request active agents list
      sendMessage({
        type: 'agent_discover',
        content: {
          userId: user?.id
        }
      });
      
      // For now, assume all agents are active
      setActiveAgents([
        'data_validation',
        'legal_compliance',
        'map_intelligence',
        'master_control'
      ]);
    }
  }, [isConnected, sendMessage, user]);
  
  // Create context value
  const contextValue = useMemo(() => ({
    requestAgentAssistance,
    lastResponse,
    responses,
    clearResponses,
    isProcessing,
    isAvailable,
    activeAgents
  }), [
    requestAgentAssistance,
    lastResponse,
    responses,
    clearResponses,
    isProcessing,
    isAvailable,
    activeAgents
  ]);
  
  return (
    <AgentSystemContext.Provider value={contextValue}>
      {children}
    </AgentSystemContext.Provider>
  );
};

// Custom hook to use the agent system context
export const useAgentSystem = () => {
  const context = useContext(AgentSystemContext);
  
  if (!context) {
    throw new Error('useAgentSystem must be used within an AgentSystemProvider');
  }
  
  return context;
};

export default AgentSystemContext;