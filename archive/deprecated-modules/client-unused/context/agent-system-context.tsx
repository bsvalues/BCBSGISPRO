/**
 * Agent System Context
 * 
 * This context provides access to the AI agent system throughout the application,
 * allowing components to interact with specialized agents and the Master Control Program (MCP).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocketContext, WebSocketMessage } from './websocket-context';
import { AGENTS } from '../services/agent-collaboration-service';
import { useToast } from '../hooks/use-toast';
import { check_secrets } from '../lib/api';

// Define the structure of agent response
export interface AgentResponse {
  requestId: string;
  agentId: string;
  query: string;
  response: string;
  timestamp: Date;
  metadata?: {
    processing_time?: number;
    routing?: {
      primaryAgent: string;
      secondaryAgents?: string[];
      explanation: string;
    }
  }
}

// Define the agent system context interface
interface AgentSystemContextType {
  isAvailable: boolean;
  isProcessing: boolean;
  activeAgents: string[];
  lastResponse: AgentResponse | null;
  responses: Record<string, AgentResponse>;
  requestAgentAssistance: (agentId: string, query: string, contextData?: string) => string | null;
  clearResponses: () => void;
}

// Create the context
const AgentSystemContext = createContext<AgentSystemContextType>({
  isAvailable: false,
  isProcessing: false,
  activeAgents: [],
  lastResponse: null,
  responses: {},
  requestAgentAssistance: () => null,
  clearResponses: () => {}
});

// Hook for using the agent system context
export const useAgentSystem = () => useContext(AgentSystemContext);

// Provider component
export const AgentSystemProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeAgents, setActiveAgents] = useState<string[]>(['master_control']);
  const [responses, setResponses] = useState<Record<string, AgentResponse>>({});
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  
  // Dependencies
  const { isConnected, sendMessage, addMessageListener } = useWebSocketContext();
  const { toast } = useToast();
  
  // Check for API keys
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const hasSecret = await check_secrets(['ANTHROPIC_API_KEY']);
        setIsAvailable(hasSecret.ANTHROPIC_API_KEY);
        
        if (!hasSecret.ANTHROPIC_API_KEY) {
          console.warn('Anthropic API key not configured');
        }
      } catch (error) {
        console.error('Error checking API key:', error);
        setIsAvailable(false);
      }
    };
    
    checkApiKey();
  }, []);
  
  // Listen for agent system status updates
  useEffect(() => {
    if (isConnected) {
      // Request agent system status
      sendMessage({ type: 'agent_system_status_request' });
      
      // Set up listener for agent-related WebSocket messages
      const cleanup = addMessageListener((message: WebSocketMessage) => {
        // Handle agent system status updates
        if (message.type === 'agent_system_status') {
          setIsAvailable(message.content?.available ?? false);
          setActiveAgents(message.content?.activeAgents ?? ['master_control']);
        }
        
        // Handle agent status updates
        else if (message.type === 'agent_status') {
          const { requestId, step, agentId, message: responseMessage, metadata } = message.content || {};
          
          // Handle processing status
          if (step === 'processing') {
            setIsProcessing(true);
          }
          // Handle completed responses
          else if (step === 'completed' && requestId && agentId) {
            // Format and store the response
            const agentResponse: AgentResponse = {
              requestId,
              agentId,
              query: responses[requestId]?.query || '',
              response: responseMessage,
              timestamp: new Date(),
              metadata
            };
            
            // Update responses
            setResponses(prev => ({
              ...prev,
              [requestId]: agentResponse
            }));
            
            // Set as last response
            setLastResponse(agentResponse);
            
            // Mark processing as complete
            setIsProcessing(false);
          }
          // Handle errors
          else if (step === 'error') {
            setIsProcessing(false);
            
            // Show error toast
            toast({
              title: 'Error',
              description: responseMessage || 'An error occurred while processing your request.',
              variant: 'destructive'
            });
          }
        }
      });
      
      return cleanup;
    }
    
    return () => {};
  }, [isConnected, sendMessage, addMessageListener, responses, toast]);
  
  /**
   * Request assistance from an agent
   * 
   * @param agentId The ID of the agent to request assistance from
   * @param query The user's query
   * @param contextData Optional context data
   * @returns The request ID if successful, otherwise null
   */
  const requestAgentAssistance = (agentId: string, query: string, contextData?: string): string | null => {
    if (!isConnected || !isAvailable || isProcessing) {
      return null;
    }
    
    // Generate a request ID
    const requestId = uuidv4();
    
    // Create a request message
    const requestMessage: WebSocketMessage = {
      type: 'agent_request',
      agentId,
      content: {
        requestId,
        query,
        context: contextData
      }
    };
    
    // Store the query
    setResponses(prev => ({
      ...prev,
      [requestId]: {
        requestId,
        agentId,
        query,
        response: '',
        timestamp: new Date()
      }
    }));
    
    // Set processing state
    setIsProcessing(true);
    
    // Send the request
    sendMessage(requestMessage);
    
    return requestId;
  };
  
  /**
   * Clear all responses
   */
  const clearResponses = () => {
    setResponses({});
    setLastResponse(null);
  };
  
  // Context value
  const contextValue: AgentSystemContextType = {
    isAvailable,
    isProcessing,
    activeAgents,
    lastResponse,
    responses,
    requestAgentAssistance,
    clearResponses
  };
  
  return (
    <AgentSystemContext.Provider value={contextValue}>
      {children}
    </AgentSystemContext.Provider>
  );
};