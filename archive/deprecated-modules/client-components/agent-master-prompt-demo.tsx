import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

// Define interfaces for master prompts and agent acknowledgments
interface MasterPrompt {
  id: string;
  name: string;
  content: string;
  priority: string;
  parameters: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

interface PromptAcknowledgment {
  id: string;
  promptId: string;
  agentId: string;
  agentType: string;
  acknowledgedAt: string;
  status: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
}

interface AgentEvent {
  id: string;
  agentId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: string;
}

export default function AgentMasterPromptDemo() {
  const { toast } = useToast();
  const [tab, setTab] = useState('create');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [promptFormData, setPromptFormData] = useState({
    name: '',
    content: '',
    priority: 'NORMAL',
    parameters: {}
  });
  const [parameterInputs, setParameterInputs] = useState<{key: string, value: string}[]>([
    { key: '', value: '' }
  ]);
  const [events, setEvents] = useState<AgentEvent[]>([]);

  // Fetch prompts
  const { 
    data: prompts = [], 
    isLoading: isLoadingPrompts,
    refetch: refetchPrompts
  } = useQuery({
    queryKey: ['/api/master-prompts'],
    enabled: true
  });

  // Fetch acknowledgments
  const {
    data: acknowledgments = [],
    isLoading: isLoadingAcknowledgments,
    refetch: refetchAcknowledgments
  } = useQuery({
    queryKey: ['/api/master-prompts/acknowledgments'],
    enabled: true
  });

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const result = await apiRequest('/api/agents', {
          method: 'GET'
        });
        
        if (result.success) {
          setAgents(result.data);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };
    
    fetchAgents();
  }, []);

  // Create master prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: async (promptData: any) => {
      return await apiRequest('/api/master-prompts', {
        method: 'POST',
        body: promptData
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Master prompt "${promptData.name}" created!`,
      });
      
      // Reset form
      setPromptFormData({
        name: '',
        content: '',
        priority: 'NORMAL',
        parameters: {}
      });
      setParameterInputs([{ key: '', value: '' }]);
      
      // Refresh data
      refetchPrompts();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create master prompt: ${error}`,
        variant: "destructive"
      });
    }
  });

  // Broadcast prompt mutation
  const broadcastPromptMutation = useMutation({
    mutationFn: async ({ promptId, agentIds }: { promptId: string, agentIds: string[] }) => {
      return await apiRequest(`/api/master-prompts/${promptId}/broadcast`, {
        method: 'POST',
        body: { agentIds }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Master prompt broadcasted to selected agents!",
      });
      
      // Refresh data
      refetchAcknowledgments();
      fetchEvents();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to broadcast prompt: ${error}`,
        variant: "destructive"
      });
    }
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPromptFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle parameter input changes
  const handleParameterInputChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParameters = [...parameterInputs];
    newParameters[index][field] = value;
    setParameterInputs(newParameters);
  };

  // Add parameter input field
  const addParameterInput = () => {
    setParameterInputs([...parameterInputs, { key: '', value: '' }]);
  };

  // Remove parameter input field
  const removeParameterInput = (index: number) => {
    const newParameters = [...parameterInputs];
    newParameters.splice(index, 1);
    setParameterInputs(newParameters);
  };

  // Create master prompt
  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build parameters object from inputs
    const parameters: Record<string, any> = {};
    parameterInputs.forEach(param => {
      if (param.key && param.value) {
        try {
          // Try to parse as JSON if possible
          parameters[param.key] = JSON.parse(param.value);
        } catch {
          // Otherwise use as string
          parameters[param.key] = param.value;
        }
      }
    });
    
    const promptData = {
      ...promptFormData,
      parameters
    };
    
    createPromptMutation.mutate(promptData);
  };

  // Broadcast prompt to agents
  const handleBroadcastPrompt = (promptId: string) => {
    if (selectedAgentIds.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one agent to broadcast to.",
        variant: "destructive"
      });
      return;
    }
    
    broadcastPromptMutation.mutate({ promptId, agentIds: selectedAgentIds });
  };

  // Toggle agent selection
  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // Fetch agent events
  const fetchEvents = async () => {
    try {
      const result = await apiRequest('/api/agents/events', {
        method: 'GET',
        params: {
          eventTypes: ['MASTER_PROMPT_RECEIVED', 'MASTER_PROMPT_ACKNOWLEDGED'].join(','),
          limit: 50
        }
      });
      
      if (result.success) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error('Error fetching agent events:', error);
    }
  };

  // Initialize fetch events
  useEffect(() => {
    fetchEvents();
    
    // Set up polling for events every 5 seconds
    const interval = setInterval(fetchEvents, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get agent name from ID
  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : agentId;
  };

  // Get prompt name from ID
  const getPromptName = (promptId: string) => {
    const prompt = (prompts as MasterPrompt[]).find(p => p.id === promptId);
    return prompt ? prompt.name : promptId;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Master Prompt Orchestration System</h1>
      
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Prompt</TabsTrigger>
          <TabsTrigger value="manage">Manage Prompts</TabsTrigger>
          <TabsTrigger value="events">Agent Events</TabsTrigger>
        </TabsList>
        
        {/* Create Prompt Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Master Prompt</CardTitle>
              <CardDescription>
                Define a new master prompt to send to agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePrompt} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Prompt Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={promptFormData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter a descriptive name" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Prompt Content</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    value={promptFormData.content} 
                    onChange={handleInputChange} 
                    placeholder="Enter the directive content for agents" 
                    rows={5}
                    required 
                  />
                  <p className="text-sm text-muted-foreground">
                    Include directive keywords like ENFORCE_STRICT_COMPLIANCE, PRIORITIZE_PARCEL_VALIDATION,
                    or ENHANCE_DATA_QUALITY_VISUALIZATION
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select name="priority" value={promptFormData.priority} onValueChange={(value) => setPromptFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Parameters</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addParameterInput}>
                      Add Parameter
                    </Button>
                  </div>
                  
                  {parameterInputs.map((param, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input 
                        placeholder="Parameter Key" 
                        value={param.key} 
                        onChange={(e) => handleParameterInputChange(index, 'key', e.target.value)} 
                        className="flex-1"
                      />
                      <Input 
                        placeholder="Value (string or JSON)" 
                        value={param.value} 
                        onChange={(e) => handleParameterInputChange(index, 'value', e.target.value)} 
                        className="flex-1"
                      />
                      {index > 0 && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => removeParameterInput(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    Add agent-specific parameters like complianceThresholds, layerVisibility, or dataQualityVisualization
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreatePrompt} disabled={createPromptMutation.isPending}>
                {createPromptMutation.isPending ? "Creating..." : "Create Master Prompt"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Manage Prompts Tab */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Master Prompts</CardTitle>
              <CardDescription>
                View, broadcast, and track prompts across agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Prompts List */}
                <div className="w-full md:w-1/2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Available Prompts</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchPrompts()}
                    >
                      Refresh
                    </Button>
                  </div>
                  
                  {isLoadingPrompts ? (
                    <div className="flex justify-center p-4">Loading prompts...</div>
                  ) : (prompts as MasterPrompt[]).length === 0 ? (
                    <div className="text-center p-4 border rounded-md">
                      No master prompts available. Create one first.
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] rounded-md border p-4">
                      <div className="space-y-4">
                        {(prompts as MasterPrompt[]).map((prompt) => (
                          <Card key={prompt.id} className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{prompt.name}</CardTitle>
                                <Badge>{prompt.priority}</Badge>
                              </div>
                              <CardDescription>
                                Created: {formatDate(prompt.createdAt)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="p-2 bg-muted rounded-md mt-2 text-sm font-mono">
                                {prompt.content.length > 100 
                                  ? `${prompt.content.substring(0, 100)}...` 
                                  : prompt.content}
                              </div>
                              {Object.keys(prompt.parameters).length > 0 && (
                                <div className="mt-2">
                                  <Label className="text-xs">Parameters:</Label>
                                  <div className="p-2 bg-muted rounded-md mt-1 text-xs font-mono">
                                    {JSON.stringify(prompt.parameters, null, 2)}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleBroadcastPrompt(prompt.id)}
                                disabled={broadcastPromptMutation.isPending}
                              >
                                Broadcast to Agents
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
                
                {/* Agents Selection */}
                <div className="w-full md:w-1/2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Select Agents for Broadcast</h3>
                  </div>
                  
                  <div className="rounded-md border p-4">
                    {agents.length === 0 ? (
                      <div className="text-center p-4">
                        Loading agents...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {agents.map((agent) => (
                          <div 
                            key={agent.id} 
                            className="flex items-start space-x-3 p-3 border rounded-md"
                          >
                            <Checkbox 
                              id={`agent-${agent.id}`}
                              checked={selectedAgentIds.includes(agent.id)}
                              onCheckedChange={() => toggleAgentSelection(agent.id)}
                            />
                            <div className="space-y-1">
                              <Label 
                                htmlFor={`agent-${agent.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {agent.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {agent.description}
                              </p>
                              <Badge 
                                variant={agent.isActive ? "default" : "destructive"}
                                className="mt-1"
                              >
                                {agent.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Acknowledgments */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium">Prompt Acknowledgments</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchAcknowledgments()}
                      >
                        Refresh
                      </Button>
                    </div>
                    
                    {isLoadingAcknowledgments ? (
                      <div className="flex justify-center p-4">Loading acknowledgments...</div>
                    ) : (acknowledgments as PromptAcknowledgment[]).length === 0 ? (
                      <div className="text-center p-4 border rounded-md">
                        No acknowledgments yet. Broadcast a prompt first.
                      </div>
                    ) : (
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        <div className="space-y-3">
                          {(acknowledgments as PromptAcknowledgment[]).map((ack) => (
                            <div key={ack.id} className="flex justify-between items-center p-2 border-b">
                              <div>
                                <span className="font-medium">{getAgentName(ack.agentId)}</span>
                                <span className="text-sm text-muted-foreground"> acknowledged </span>
                                <span className="font-medium">{getPromptName(ack.promptId)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={ack.status === 'ACKNOWLEDGED' ? "default" : "outline"}>
                                  {ack.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(ack.acknowledgedAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Agent Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Agent Events</CardTitle>
              <CardDescription>
                View agent activity related to master prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Recent Events</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchEvents}
                  >
                    Refresh
                  </Button>
                </div>
                
                {events.length === 0 ? (
                  <div className="text-center p-6 border rounded-md">
                    No events recorded yet. Events will appear after prompts are broadcasted.
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] rounded-md border">
                    <div className="p-4 space-y-4">
                      {events.map((event) => (
                        <Card key={event.id} className="overflow-hidden">
                          <CardHeader className="p-3 pb-1">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-md font-medium">
                                {getAgentName(event.agentId)}
                              </CardTitle>
                              <Badge variant={
                                event.eventType === 'MASTER_PROMPT_RECEIVED' 
                                  ? "default" 
                                  : event.eventType === 'MASTER_PROMPT_ACKNOWLEDGED'
                                    ? "success"
                                    : "outline"
                              }>
                                {event.eventType.replace('MASTER_PROMPT_', '')}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {formatDate(event.timestamp)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <div className="text-sm">
                              {event.eventType === 'MASTER_PROMPT_RECEIVED' && (
                                <p>
                                  Received prompt: <span className="font-medium">{event.eventData.promptName || "Unknown"}</span>
                                </p>
                              )}
                              {event.eventType === 'MASTER_PROMPT_ACKNOWLEDGED' && (
                                <p>
                                  Acknowledged prompt: <span className="font-medium">{getPromptName(event.eventData.promptId)}</span>
                                </p>
                              )}
                            </div>
                            <div className="mt-2 p-2 rounded-md bg-muted text-xs font-mono">
                              {JSON.stringify(event.eventData, null, 2)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}