import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
} from 'react-flow-renderer';
import { DocumentLineageGraph, DocumentLineageNode as SchemaNode, DocumentLineageEdge as SchemaEdge } from '../../../shared/document-lineage-schema';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Custom node types
import DocumentNode from './nodes/document-node';
import EventNode from './nodes/event-node';
import ProcessingNode from './nodes/processing-node';

const nodeTypes = {
  document: DocumentNode,
  event: EventNode,
  stage: ProcessingNode,
  processor: ProcessingNode,
};

// Edge types with custom styling
const edgeTypes = {
  // You can add custom edge renderers here if needed
};

// Default styling for edges based on type
const getEdgeStyle = (type: string) => {
  switch (type) {
    case 'previous-version':
      return { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5,5' };
    case 'derived-from':
      return { stroke: '#0ea5e9', strokeWidth: 2 };
    case 'references':
      return { stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '3,3' };
    case 'related-to':
      return { stroke: '#8b5cf6', strokeWidth: 1.5 };
    case 'event':
      return { stroke: '#f59e0b', strokeWidth: 2 };
    case 'processing':
      return { stroke: '#ef4444', strokeWidth: 2 };
    default:
      return { stroke: '#6b7280', strokeWidth: 1 };
  }
};

export interface DocumentLineageGraphProps {
  data: DocumentLineageGraph | null;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
  onNodeDoubleClick?: (nodeId: string, nodeType: string) => void;
  isLoading?: boolean;
}

export function DocumentLineageGraph({ 
  data, 
  onNodeClick,
  onNodeDoubleClick,
  isLoading = false
}: DocumentLineageGraphProps) {
  // Convert schema nodes/edges to ReactFlow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!data) {
      return { initialNodes: [], initialEdges: [] };
    }
    
    // Map schema nodes to ReactFlow nodes
    const nodes: Node[] = data.nodes.map((node: SchemaNode) => {
      const position = node.data.position || {
        x: Math.random() * 500,
        y: Math.random() * 400,
      };
      
      return {
        id: node.id,
        type: node.type,
        position,
        data: {
          ...node.data,
          label: node.label,
        },
      };
    });
    
    // Map schema edges to ReactFlow edges
    const edges: Edge[] = data.edges.map((edge: SchemaEdge) => {
      const style = getEdgeStyle(edge.type);
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default', // or a custom edge type if needed
        label: edge.type,
        style: style,
        animated: edge.type === 'event' || edge.type === 'processing',
        data: edge.data,
      };
    });
    
    return {
      initialNodes: nodes,
      initialEdges: edges,
    };
  }, [data]);
  
  // Manage nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update when data changes
  useMemo(() => {
    if (data) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [data, initialNodes, initialEdges, setNodes, setEdges]);
  
  // Handle node clicks
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id, node.type || 'unknown');
      }
    },
    [onNodeClick]
  );
  
  // Handle node double clicks
  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node.id, node.type || 'unknown');
      }
    },
    [onNodeDoubleClick]
  );
  
  // Handle connections between nodes (optional)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  // Empty state handling
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] w-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 mb-4"></div>
          <div className="h-4 w-48 bg-primary/20 rounded"></div>
          <div className="mt-2 h-3 w-64 bg-primary/10 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!data || (nodes.length === 0 && edges.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[500px] w-full bg-muted/20 rounded-lg border border-border">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">No Lineage Data Available</h3>
          <p className="text-sm text-muted-foreground">
            Select a document to view its lineage and provenance information.
          </p>
        </div>
      </div>
    );
  }
  
  // Visualization settings
  const [showMinimap, setShowMinimap] = useState(true);
  
  return (
    <Card className="p-0 shadow-md h-[600px] w-full bg-background/60 backdrop-blur-md border-primary/10">
      <div style={{ height: '100%', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          {showMinimap && (
            <MiniMap
              nodeStrokeColor={(n) => {
                if (n.type === 'document') return '#3b82f6';
                if (n.type === 'event') return '#f59e0b';
                if (n.type === 'stage' || n.type === 'processor') return '#ef4444';
                return '#6b7280';
              }}
              nodeColor={(n) => {
                if (n.type === 'document') return '#3b82f680';
                if (n.type === 'event') return '#f59e0b80';
                if (n.type === 'stage' || n.type === 'processor') return '#ef444480';
                return '#6b728080';
              }}
              maskColor="#f8fafc50"
              className="bg-background/60 backdrop-blur-sm rounded-md shadow-md"
            />
          )}
          <Controls 
            className="bg-background/60 backdrop-blur-sm rounded-md shadow-md" 
            position="bottom-left"
          />
          <Background color="#aaa" gap={16} />
          
          {/* Legend */}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-sm border border-border z-10 max-w-[200px]">
            <h4 className="text-xs font-medium mb-1">Legend</h4>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Badge variant="default" className="bg-blue-500">Document</Badge>
                <span className="text-xs">Source files</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="default" className="bg-amber-500">Event</Badge>
                <span className="text-xs">Processing events</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="default" className="bg-red-500">Stage</Badge>
                <span className="text-xs">Processing steps</span>
              </div>
            </div>
          </div>
        </ReactFlow>
      </div>
    </Card>
  );
}

export default DocumentLineageGraph;