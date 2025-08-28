import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TableNodeData {
  tableName: string;
  tableType: string;
  parents: string[];
  children: string[];
}

interface TableNodeProps {
  data: TableNodeData;
}

const TableNode = memo(({ data }: TableNodeProps) => {
  const { tableName, tableType, parents, children } = data;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="p-4 min-w-[200px] border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm text-foreground">{tableName}</h3>
                <p className="text-xs text-muted-foreground">{tableType}</p>
              </div>
            </div>
            
            {/* Handles for connections */}
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3 !bg-primary border-2 border-background"
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 !bg-primary border-2 border-background"
            />
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Table Name:</span> {tableName}
            </div>
            {parents.length > 0 && (
              <div>
                <span className="font-semibold">Parent Tables:</span> {parents.join(', ')}
              </div>
            )}
            {children.length > 0 && (
              <div>
                <span className="font-semibold">Child Tables:</span> {children.join(', ')}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TableNode.displayName = 'TableNode';

export default TableNode;