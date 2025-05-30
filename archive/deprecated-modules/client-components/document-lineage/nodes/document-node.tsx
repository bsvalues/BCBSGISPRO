import { memo } from 'react';
import { Handle, Position, NodeProps } from 'react-flow-renderer';
import { FileText, Calendar, User, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import { DocumentEntity } from '../../../../shared/document-lineage-schema';

interface DocumentNodeData extends DocumentEntity {
  label: string;
}

function DocumentNode({ data }: NodeProps<DocumentNodeData>) {
  const formattedDate = data.uploadedAt ? formatDate(new Date(data.uploadedAt)) : 'Unknown date';
  
  return (
    <div className="px-4 py-3 rounded-lg shadow-md bg-background/90 backdrop-blur-sm border-2 border-blue-500/30 min-w-[200px] text-sm">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3"
      />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-blue-500/10">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-medium truncate">{data.label || data.documentName}</span>
      </div>
      
      <div className="border-t border-blue-200/30 pt-2 space-y-1.5">
        <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
          <Tag className="h-3.5 w-3.5 text-blue-500/70" />
          <span className="truncate">{data.documentType}</span>
        </div>
        
        <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5 text-blue-500/70" />
          <span className="truncate">{data.uploadedBy}</span>
        </div>
        
        <div className="flex gap-1.5 items-center text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-blue-500/70" />
          <span className="truncate">{formattedDate}</span>
        </div>
        
        {data.parcelId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="mt-1 inline-block">
                <Badge variant="outline" className="bg-blue-500/10 text-xs">
                  Parcel: {data.parcelId}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Related to parcel {data.parcelId}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(DocumentNode);