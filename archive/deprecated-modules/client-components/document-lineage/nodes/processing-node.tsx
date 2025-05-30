import { memo } from 'react';
import { Handle, Position, NodeProps } from 'react-flow-renderer';
import { Workflow, Clock, Cpu, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import { DocumentProcessingStage } from '../../../../shared/document-lineage-schema';

interface ProcessingNodeData extends DocumentProcessingStage {
  label: string;
}

function ProcessingNode({ data }: NodeProps<ProcessingNodeData>) {
  const formattedStartDate = data.startedAt 
    ? formatDate(new Date(data.startedAt)) 
    : 'Not started';
    
  const formattedEndDate = data.completedAt 
    ? formatDate(new Date(data.completedAt)) 
    : null;
  
  // Calculate status icon and color based on status
  const getStatusIconAndColor = () => {
    switch (data.status) {
      case 'completed':
        return { icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-green-600', bg: 'bg-green-500/10' };
      case 'failed':
        return { icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'text-red-600', bg: 'bg-red-500/10' };
      case 'in_progress':
        return { icon: <Workflow className="h-3.5 w-3.5" />, color: 'text-blue-600', bg: 'bg-blue-500/10' };
      default:
        return { icon: <HelpCircle className="h-3.5 w-3.5" />, color: 'text-gray-600', bg: 'bg-gray-500/10' };
    }
  };
  
  const { icon, color, bg } = getStatusIconAndColor();
  
  // Calculate progress
  const progress = data.progress !== undefined ? data.progress : 
                   data.status === 'completed' ? 100 : 
                   data.status === 'failed' ? 0 : 
                   data.status === 'in_progress' ? 50 : 0;
  
  return (
    <div className="px-4 py-3 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border-2 border-red-500/30 min-w-[180px] text-sm">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-red-500 !w-3 !h-3"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-red-500/10">
          <Cpu className="h-4 w-4 text-red-600" />
        </div>
        <span className="font-medium truncate">{data.label || data.stageName}</span>
      </div>
      
      <div className="border-t border-red-200/30 pt-2 space-y-1.5">
        <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-red-500/70" />
          <span className="truncate">{formattedStartDate}</span>
        </div>
        
        {formattedEndDate && (
          <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-red-500/70" />
            <span className="truncate">Completed: {formattedEndDate}</span>
          </div>
        )}
        
        <div className="mt-2">
          <Progress value={progress} className="h-1.5" />
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <Badge
            variant="outline"
            className={`text-xs ${color} ${bg}`}
          >
            {icon}
            <span className="ml-1 capitalize">{data.status?.replace('_', ' ') || 'Unknown'}</span>
          </Badge>
          
          {data.processorName && (
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {data.processorName}
            </span>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-red-500 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(ProcessingNode);