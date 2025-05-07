/**
 * AI Agent WebSocket Handler
 * 
 * This component manages WebSocket communication for AI agents, 
 * handling message processing, agent state, and integration with Claude API.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '../../context/websocket-context';
import { useToast } from '@/hooks/use-toast';
import Anthropic from '@anthropic-ai/sdk';
import { useCurrentUser } from '@/hooks/use-current-user';

// Type definitions for agent messages
interface AgentMessage {
  type: string;
  agentId?: string;
  content?: any;
  timestamp: string;
  userId?: number;
  metadata?: Record<string, any>;
}

interface AgentRequest {
  query: string;
  context?: string;
  userId: number;
  agentId: string;
  requestId: string;
  tools?: string[];
}

interface AgentResponse {
  response: string;
  requestId: string;
  agentId: string;
  userId: number;
  timestamp: string;
  metadata?: {
    tool_calls?: any[];
    reasoning?: string;
    confidence?: number;
    [key: string]: any;
  };
}

// Component props
interface AgentWebSocketHandlerProps {
  children?: React.ReactNode;
}

// Initialize Claude client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

// Main component
const AgentWebSocketHandler: React.FC<AgentWebSocketHandlerProps> = ({ children }) => {
  const { addMessageListener, sendMessage, isConnected } = useWebSocketContext();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const pendingRequestsRef = useRef<Map<string, AgentRequest>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Generate unique request ID
  const generateRequestId = useCallback(() => {
    return `req_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  }, []);

  // Process agent request using Claude API
  const processAgentRequest = useCallback(async (request: AgentRequest) => {
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      console.error('Anthropic API key not found');
      // Send error response over WebSocket
      sendMessage({
        type: 'agent_response',
        content: {
          response: "API key missing. Please contact administrator.",
          requestId: request.requestId,
          agentId: request.agentId,
          userId: request.userId,
          timestamp: new Date().toISOString(),
          metadata: { error: "API_KEY_MISSING" }
        }
      });
      return;
    }
    
    try {
      // Construct the system prompt based on agent type
      let systemPrompt = "You are a GIS assistant helping with geographic data.";
      
      if (request.agentId === 'legal_compliance') {
        systemPrompt = "You are a legal compliance agent specializing in property records and GIS data regulations.";
      } else if (request.agentId === 'data_validation') {
        systemPrompt = "You are a data validation agent that verifies the integrity and quality of GIS datasets.";
      } else if (request.agentId === 'map_intelligence') {
        systemPrompt = "You are a map intelligence agent that analyzes geographic patterns and spatial relationships.";
      } else if (request.agentId === 'master_control') {
        systemPrompt = "You are the Master Control Program for the Benton County AI system, coordinating multiple specialized agents.";
      }
      
      // Add context from the request if available
      if (request.context) {
        systemPrompt += `\n\nContext: ${request.context}`;
      }
      
      console.log('Sending request to Claude:', { 
        agentId: request.agentId, 
        requestId: request.requestId 
      });
      
      // Call Claude API
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: "user", content: request.query }
        ],
      });
      
      const agentResponse: AgentResponse = {
        response: response.content[0].text,
        requestId: request.requestId,
        agentId: request.agentId,
        userId: request.userId,
        timestamp: new Date().toISOString(),
        metadata: {
          model: "claude-3-7-sonnet-20250219",
          usage: {
            input_tokens: response.usage?.input_tokens || 0,
            output_tokens: response.usage?.output_tokens || 0
          }
        }
      };
      
      console.log('Received response from Claude:', { 
        agentId: request.agentId, 
        requestId: request.requestId 
      });
      
      // Send response over WebSocket
      sendMessage({
        type: 'agent_response',
        content: agentResponse
      });
      
      // Remove from pending requests
      pendingRequestsRef.current.delete(request.requestId);
      
    } catch (error) {
      console.error('Error calling Claude API:', error);
      
      // Send error response over WebSocket
      sendMessage({
        type: 'agent_response',
        content: {
          response: "I encountered an error processing your request. Please try again later.",
          requestId: request.requestId,
          agentId: request.agentId,
          userId: request.userId,
          timestamp: new Date().toISOString(),
          metadata: { error: "API_ERROR", details: String(error) }
        }
      });
      
      // Remove from pending requests
      pendingRequestsRef.current.delete(request.requestId);
    }
  }, [sendMessage]);
  
  // Process WebSocket messages related to agents
  const handleAgentMessage = useCallback(async (data: AgentMessage) => {
    // Only process messages if connected and user is logged in
    if (!isConnected || !user?.id) return;
    
    // Skip messages not related to agents
    if (!data.type.startsWith('agent_')) return;
    
    switch (data.type) {
      case 'agent_request':
        // Handle incoming agent request
        if (data.content && data.userId === user.id) {
          const request = data.content as AgentRequest;
          
          // Store in pending requests
          pendingRequestsRef.current.set(request.requestId, request);
          
          // Show toast notification
          toast({
            title: `${request.agentId.replace('_', ' ')} Agent`,
            description: 'Processing your request...',
            variant: 'default',
            duration: 3000
          });
          
          // Process the request
          setIsProcessing(true);
          await processAgentRequest(request);
          setIsProcessing(false);
        }
        break;
        
      case 'agent_broadcast':
        // Handle broadcast messages from agents to all users
        if (data.content) {
          toast({
            title: 'Agent Update',
            description: data.content.message || 'New system update available',
            variant: 'default',
            duration: 5000
          });
        }
        break;
        
      case 'agent_error':
        // Handle agent errors
        if (data.content && data.userId === user.id) {
          toast({
            title: 'Agent Error',
            description: data.content.message || 'An error occurred with the agent system',
            variant: 'destructive',
            duration: 5000
          });
        }
        break;
        
      default:
        // Ignore other agent message types
        break;
    }
  }, [isConnected, user, toast, processAgentRequest]);
  
  // Send a request to an AI agent
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
      userId: user.id,
      agentId,
      requestId,
      tools
    };
    
    // Send request over WebSocket
    sendMessage({
      type: 'agent_request',
      content: request
    });
    
    // Store in pending requests
    pendingRequestsRef.current.set(requestId, request);
    
    return requestId;
  }, [isConnected, user, generateRequestId, sendMessage, toast]);
  
  // Setup WebSocket message listener
  useEffect(() => {
    // Add WebSocket message listener
    const cleanup = addMessageListener(handleAgentMessage);
    
    return () => {
      // Clean up WebSocket message listener
      cleanup();
    };
  }, [addMessageListener, handleAgentMessage]);
  
  // Set global window function for direct use
  useEffect(() => {
    if (window) {
      // Add global agent request function for debugging/console use
      (window as any).requestAgentAssistance = requestAgentAssistance;
    }
    
    return () => {
      // Clean up global function
      if (window) {
        delete (window as any).requestAgentAssistance;
      }
    };
  }, [requestAgentAssistance]);
  
  // Expose the agent capabilities to children via context if needed
  return (
    <>
      {children}
    </>
  );
};

export default AgentWebSocketHandler;