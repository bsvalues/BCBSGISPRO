/**
 * Agent Interface Component
 * 
 * A user interface for interacting with the AI agent system,
 * including specialized agents and the Master Control Program (MCP).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAgentSystem } from '../../context/agent-system-context';
import { AGENTS } from '../../services/agent-collaboration-service';
import { Check, Loader2, Send, Zap } from 'lucide-react';

// Agent interface component props
interface AgentInterfaceProps {
  defaultAgentId?: string;
  contextData?: string;
  className?: string;
}

/**
 * Agent Interface Component
 */
const AgentInterface: React.FC<AgentInterfaceProps> = ({
  defaultAgentId = 'master_control',
  contextData,
  className = ''
}) => {
  // Get agent system context
  const {
    isAvailable,
    isProcessing,
    activeAgents,
    lastResponse,
    responses,
    requestAgentAssistance
  } = useAgentSystem();
  
  // State
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId);
  const [query, setQuery] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);
  
  // Submit query to agent
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isProcessing) return;
    
    // Request assistance from the selected agent
    const requestId = requestAgentAssistance(selectedAgentId, query, contextData);
    
    if (requestId) {
      setCurrentRequestId(requestId);
      setQuery('');
    }
  };
  
  // Get agent display name
  const getAgentName = (agentId: string) => {
    return AGENTS[agentId]?.name || 'Unknown Agent';
  };
  
  // Get the current response based on the current request ID
  const currentResponse = currentRequestId ? responses[currentRequestId] : null;
  
  return (
    <div className={`flex flex-col w-full border rounded-lg overflow-hidden bg-background shadow-sm ${className}`}>
      {/* Agent selection header */}
      <div className="border-b p-3 flex items-center justify-between bg-muted/20">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <div className="font-medium">AI Agent System</div>
        </div>
        
        {/* Agent selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Agent:</span>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="text-sm rounded-md border border-input bg-background px-2 py-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isProcessing || !isAvailable}
          >
            {activeAgents.map((agentId) => (
              <option key={agentId} value={agentId}>
                {getAgentName(agentId)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Response display */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[200px] max-h-[400px] text-sm">
        {!isAvailable && (
          <div className="p-3 bg-muted/20 rounded-lg text-center">
            <div className="font-medium mb-1">Agent System Unavailable</div>
            <div className="text-sm text-muted-foreground">
              Please check your API configuration to enable agent functionality.
            </div>
          </div>
        )}
        
        {isAvailable && !currentResponse && (
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="font-medium mb-1">How can I assist you?</div>
            <div className="text-sm text-muted-foreground">
              {AGENTS[selectedAgentId]?.description || 'Ask me a question about the Benton County GIS system.'}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium">Agent capabilities:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {AGENTS[selectedAgentId]?.capabilities.map((capability, index) => (
                  <span key={index} className="px-2 py-1 bg-muted/40 rounded-md text-xs">
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {currentResponse && (
          <div className="p-3 bg-muted/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="font-medium text-sm">{getAgentName(currentResponse.agentId)}</div>
              <Check className="h-3.5 w-3.5 text-green-500" />
            </div>
            <div className="whitespace-pre-wrap">
              {currentResponse.response}
            </div>
            
            {/* Optional metadata display */}
            {currentResponse.metadata?.routing && (
              <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                <div className="font-medium">Agent Selection Logic:</div>
                <div className="mt-1">{currentResponse.metadata.routing.explanation}</div>
                
                {currentResponse.metadata.routing.secondaryAgents?.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">Contributing Agents: </span>
                    {currentResponse.metadata.routing.secondaryAgents.map(id => getAgentName(id)).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-4 flex items-center justify-center p-4 text-primary">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Processing request...</span>
          </div>
        )}
      </div>
      
      {/* Query input */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the AI agent a question..."
            className="w-full resize-none border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[60px] max-h-[150px] pr-10"
            rows={1}
            disabled={!isAvailable || isProcessing}
          />
          <button
            type="submit"
            className="absolute right-2 bottom-2 text-primary hover:text-primary/80 disabled:text-muted-foreground"
            disabled={!query.trim() || !isAvailable || isProcessing}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentInterface;