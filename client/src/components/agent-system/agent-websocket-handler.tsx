/**
 * Agent WebSocket Handler
 * 
 * This component handles WebSocket messages related to agent interactions,
 * including requests to the Master Control Program (MCP) for agent collaboration.
 */

import React, { useEffect, useCallback } from 'react';
import { useWebSocketContext, WebSocketMessage } from '../../context/websocket-context';
import { mcp } from '../../services/agent-collaboration-service';
import { useToast } from '../../hooks/use-toast';

interface AgentWebSocketHandlerProps {
  children?: React.ReactNode;
}

/**
 * Component that listens for agent-related WebSocket messages and processes them
 */
const AgentWebSocketHandler: React.FC<AgentWebSocketHandlerProps> = ({ children }) => {
  const { addMessageListener, sendMessage, isConnected } = useWebSocketContext();
  const { toast } = useToast();
  
  // Handle agent-related messages
  const handleAgentMessages = useCallback(async (message: WebSocketMessage) => {
    // Process agent requests
    if (message.type === 'agent_request') {
      console.log('Processing agent request:', message);
      
      try {
        // Process request through MCP if available
        if (mcp.isAvailable()) {
          // Execute collaborative workflow with multiple agents
          const responseMessages = await mcp.executeCollaborativeWorkflow(message);
          
          // Send all response messages
          for (const responseMessage of responseMessages) {
            sendMessage(responseMessage);
          }
        } else {
          // MCP not available, send error message
          sendMessage({
            type: 'agent_status',
            userId: message.userId,
            agentId: message.agentId,
            content: {
              requestId: message.content?.requestId || 'unknown',
              step: 'error',
              message: 'Agent system is not available. Please check API configuration.'
            }
          });
          
          // Show error toast
          toast({
            title: 'Agent System Unavailable',
            description: 'The AI agent system is currently unavailable. Please check your API configuration.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error processing agent request:', error);
        
        // Send error message
        sendMessage({
          type: 'agent_status',
          userId: message.userId,
          agentId: message.agentId,
          content: {
            requestId: message.content?.requestId || 'unknown',
            step: 'error',
            message: 'An error occurred while processing your request.'
          }
        });
      }
    }
    // Handle agent system status requests
    else if (message.type === 'agent_system_status_request') {
      sendMessage({
        type: 'agent_system_status',
        userId: message.userId,
        content: {
          available: mcp.isAvailable(),
          activeAgents: mcp.isAvailable() ? Object.keys(mcp.AGENTS) : []
        }
      });
    }
  }, [sendMessage, toast]);
  
  // Set up listener for agent-related WebSocket messages
  useEffect(() => {
    if (isConnected) {
      // Add message listener
      const cleanup = addMessageListener(handleAgentMessages);
      
      return cleanup;
    }
    
    return () => {};
  }, [isConnected, addMessageListener, handleAgentMessages]);
  
  // Periodically send agent system status to clients
  useEffect(() => {
    if (isConnected) {
      // Send initial status
      sendMessage({
        type: 'agent_system_status',
        content: {
          available: mcp.isAvailable(),
          activeAgents: mcp.isAvailable() ? Object.keys(mcp.AGENTS) : []
        }
      });
      
      // Update status every 5 minutes
      const intervalId = setInterval(() => {
        sendMessage({
          type: 'agent_system_status',
          content: {
            available: mcp.isAvailable(),
            activeAgents: mcp.isAvailable() ? Object.keys(mcp.AGENTS) : []
          }
        });
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(intervalId);
    }
    
    return () => {};
  }, [isConnected, sendMessage]);
  
  return <>{children}</>;
};

export default AgentWebSocketHandler;