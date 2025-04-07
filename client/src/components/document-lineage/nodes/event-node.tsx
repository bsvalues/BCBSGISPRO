import { memo } from 'react';
import { Handle, Position, NodeProps } from 'react-flow-renderer';
import { Activity, Clock, User, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { DocumentLineageEvent } from '../../../../shared/document-lineage-schema';

interface EventNodeData extends DocumentLineageEvent {
  label: string;
}

function EventNode({ data }: NodeProps<EventNodeData>) {
  const formattedDate = data.eventTimestamp 
    ? formatDate(new Date(data.eventTimestamp)) 
    : 'Unknown date';
  
  // Convert confidence to percentage if it exists
  const confidence = data.confidence 
    ? `${Math.round(data.confidence * 100)}%` 
    : null;
  
  return (
    <div className="px-4 py-3 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border-2 border-amber-500/30 min-w-[180px] text-sm">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-500 !w-3 !h-3"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-amber-500/10">
          <Activity className="h-4 w-4 text-amber-600" />
        </div>
        <span className="font-medium truncate">{data.label || data.eventType}</span>
      </div>
      
      <div className="border-t border-amber-200/30 pt-2 space-y-1.5">
        <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-amber-500/70" />
          <span className="truncate">{formattedDate}</span>
        </div>
        
        {data.performedBy && (
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 text-amber-500/70" />
            <span className="truncate">{data.performedBy}</span>
          </div>
        )}
        
        {confidence && (
          <div className="flex gap-1.5 items-center mt-1">
            <Badge
              variant="outline"
              className={`text-xs ${
                data.confidence && data.confidence >= 0.8
                  ? 'bg-green-500/10 text-green-700'
                  : data.confidence && data.confidence >= 0.5
                  ? 'bg-amber-500/10 text-amber-700'
                  : 'bg-red-500/10 text-red-700'
              }`}
            >
              <Zap className="h-3 w-3 mr-1" />
              Confidence: {confidence}
            </Badge>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-amber-500 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(EventNode);