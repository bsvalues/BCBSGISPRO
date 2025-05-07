/**
 * Agent Tools Demo Page
 * 
 * This page demonstrates how to use the agent tools in the application.
 */

import React from 'react';
import { ModernLayout } from '@/components/layout/modern-layout';
import { AgentToolsDemo } from '@/components/agent-tools';
import { useTitle } from '@/hooks/use-title';

export default function AgentToolsPage() {
  useTitle('Benton County GIS - Agent Tools');
  
  return (
    <ModernLayout>
      <AgentToolsDemo />
    </ModernLayout>
  );
}