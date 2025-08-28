import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RelationshipEdgeData {
  relationship: string;
  parentTableName: string;
  childTableName: string;
}

const RelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps & { data?: RelationshipEdgeData }) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (!data) return null;

  const { relationship, parentTableName, childTableName } = data;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                  {relationship}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="space-y-1">
                  <div><span className="font-semibold">From:</span> {parentTableName}</div>
                  <div><span className="font-semibold">To:</span> {childTableName}</div>
                  <div><span className="font-semibold">Relationship:</span> {relationship}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';

export default RelationshipEdge;