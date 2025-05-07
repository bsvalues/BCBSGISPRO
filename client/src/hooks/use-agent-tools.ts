/**
 * React Hooks for Agent Tools Integration
 * 
 * These hooks provide an easy way to interact with the agent tools in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Agent, 
  AgentTypeKey, 
  AgentRequest, 
  AgentResponse, 
  SystemStatus 
} from '../../../shared/agent-tools';
import * as AgentService from '../services/agent-tools-service';

/**
 * Hook to get all available agents
 */
export function useAgents() {
  return useQuery({
    queryKey: ['/api/agent-tools/agents'],
    queryFn: () => AgentService.getAgents(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get a specific agent by ID
 */
export function useAgentById(agentId: string) {
  return useQuery({
    queryKey: ['/api/agent-tools/agents', agentId],
    queryFn: () => AgentService.getAgentById(agentId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!agentId,
  });
}

/**
 * Hook to get agents by type
 */
export function useAgentsByType(type: AgentTypeKey) {
  return useQuery({
    queryKey: ['/api/agent-tools/agents/type', type],
    queryFn: () => AgentService.getAgentsByType(type),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!type,
  });
}

/**
 * Hook to get agent capabilities
 */
export function useAgentCapabilities(agentId: string) {
  return useQuery({
    queryKey: ['/api/agent-tools/agents/capabilities', agentId],
    queryFn: () => AgentService.getAgentCapabilities(agentId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!agentId,
  });
}

/**
 * Hook to get system status
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: ['/api/agent-tools/status'],
    queryFn: () => AgentService.getSystemStatus(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Refresh every minute
  });
}

/**
 * Hook to send a request to an agent
 */
export function useAgentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AgentRequest) => 
      AgentService.sendAgentRequest(request),
    onSuccess: () => {
      // Could invalidate specific queries based on the request type
      queryClient.invalidateQueries({ queryKey: ['/api/agent-tools/agents'] });
    },
  });
}

/**
 * Hook for Map Intelligence Agent layer recommendations
 */
export function useLayerRecommendations() {
  const agentRequest = useAgentRequest();

  const getRecommendations = useCallback((params: {
    task: string;
    location?: { lat: number; lng: number };
    userRole?: string;
    dataQualityFocus?: string[];
  }) => {
    return agentRequest.mutateAsync({
      type: 'MAP_INTELLIGENCE',
      action: 'GET_LAYER_RECOMMENDATIONS',
      payload: params,
    });
  }, [agentRequest]);

  return {
    getRecommendations,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}

/**
 * Hook for customizing map layers for a specific task
 */
export function useTaskLayerCustomization() {
  const agentRequest = useAgentRequest();

  const customizeLayers = useCallback((params: {
    taskId?: string;
    taskType: string;
    location?: { lat: number; lng: number };
    dataQualityFocus?: string[];
  }) => {
    return agentRequest.mutateAsync({
      type: 'MAP_INTELLIGENCE',
      action: 'CUSTOMIZE_LAYERS_FOR_TASK',
      payload: params,
    });
  }, [agentRequest]);

  return {
    customizeLayers,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}

/**
 * Hook for highlighting data quality issues on the map
 */
export function useDataQualityHighlighting() {
  const agentRequest = useAgentRequest();

  const highlightIssues = useCallback((params: {
    location: { lat: number; lng: number };
    radius: number;
    issueTypes?: string[];
  }) => {
    return agentRequest.mutateAsync({
      type: 'MAP_INTELLIGENCE',
      action: 'HIGHLIGHT_DATA_QUALITY_ISSUES',
      payload: params,
    });
  }, [agentRequest]);

  return {
    highlightIssues,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}

/**
 * Hook for evaluating entity data quality
 */
export function useEntityQualityEvaluation() {
  const agentRequest = useAgentRequest();

  const evaluateEntity = useCallback((params: {
    entityType: string;
    entityId: number;
  }) => {
    return agentRequest.mutateAsync({
      type: 'DATA_VALIDATION',
      action: 'EVALUATE_ENTITY',
      payload: params,
    });
  }, [agentRequest]);

  return {
    evaluateEntity,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}

/**
 * Hook for getting data quality score for an entity
 */
export function useQualityScore() {
  const agentRequest = useAgentRequest();

  const getScore = useCallback((params: {
    entityType: string;
    entityId: number;
  }) => {
    return agentRequest.mutateAsync({
      type: 'DATA_VALIDATION',
      action: 'GET_QUALITY_SCORE',
      payload: params,
    });
  }, [agentRequest]);

  return {
    getScore,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}

/**
 * Hook for checking document compliance with regulations
 */
export function useDocumentComplianceCheck() {
  const agentRequest = useAgentRequest();

  const checkCompliance = useCallback((params: {
    documentId: number;
    documentType: string;
  }) => {
    return agentRequest.mutateAsync({
      type: 'LEGAL_COMPLIANCE',
      action: 'CHECK_DOCUMENT_COMPLIANCE',
      payload: params,
    });
  }, [agentRequest]);

  return {
    checkCompliance,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}

/**
 * Hook for checking entity compliance with regulations
 */
export function useEntityComplianceCheck() {
  const agentRequest = useAgentRequest();

  const checkCompliance = useCallback((params: {
    entityId: number;
    entityType: string;
    regulationType?: string;
  }) => {
    return agentRequest.mutateAsync({
      type: 'LEGAL_COMPLIANCE',
      action: 'CHECK_ENTITY_COMPLIANCE',
      payload: params,
    });
  }, [agentRequest]);

  return {
    checkCompliance,
    isLoading: agentRequest.isPending,
    isError: agentRequest.isError,
    error: agentRequest.error,
  };
}