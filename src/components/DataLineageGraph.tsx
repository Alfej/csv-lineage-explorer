import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import TableNode from './TableNode';
import RelationshipEdge from './RelationshipEdge';
import { useLineageState } from '../hooks/useLineageState';

interface DataLineageGraphProps {
  csvData: string[][];
  hiddenNodes: Set<string>;
  onHiddenNodesChange: (hiddenNodes: Set<string>) => void;
}

interface TableData {
  childTableName: string;
  childTableType: string;
  relationship: string;
  parentTableName: string;
  parentTableType: string;
}

const nodeTypes = {
  table: TableNode,
};

const edgeTypes = {
  relationship: RelationshipEdge as any,
};

const DataLineageGraph = ({ csvData, hiddenNodes, onHiddenNodesChange }: DataLineageGraphProps) => {
  const { state, updateState, currentCsvHash } = useLineageState(csvData);

  // Check if we're loading the same CSV file
  useEffect(() => {
    if (state.csvHash === currentCsvHash) {
      // Restore hidden nodes
      onHiddenNodesChange(new Set(state.hiddenNodes));
    } else {
      // New CSV file, update hash
      updateState({ csvHash: currentCsvHash, hiddenNodes: [], nodePositions: {} });
    }
  }, [currentCsvHash]);

  // Save node positions when they change
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Save position changes
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateState({
          nodePositions: {
            ...state.nodePositions,
            [change.id]: change.position
          }
        });
      }
    });
  }, [state.nodePositions, updateState]);

  // Save hidden nodes when they change
  useEffect(() => {
    updateState({ hiddenNodes: Array.from(hiddenNodes) });
  }, [hiddenNodes]);

  // Parse CSV data using header row
  const tableData: TableData[] = useMemo(() => {
    if (csvData.length === 0) return [];

    const headers = csvData[0].map(h => h.toLowerCase().trim());
    const columnIndexes = {
      childTableName: headers.indexOf('childtablename'),
      childTableType: headers.indexOf('childtabletype'),
      relationship: headers.indexOf('relationship'),
      parentTableName: headers.indexOf('parenttablename'),
      parentTableType: headers.indexOf('parenttabletype')
    };

    // Validate if all required columns are present
    if (Object.values(columnIndexes).some(index => index === -1)) {
      console.error('Missing required columns in CSV header');
      return [];
    }

    return csvData.slice(1).map(row => ({
      childTableName: row[columnIndexes.childTableName] || '',
      childTableType: row[columnIndexes.childTableType] || '',
      relationship: row[columnIndexes.relationship] || '',
      parentTableName: row[columnIndexes.parentTableName] || '',
      parentTableType: row[columnIndexes.parentTableType] || '',
    }));
  }, [csvData]);

  // Create nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (tableData.length === 0) return { initialNodes: [], initialEdges: [] };
    
    const tableMap = new Map<string, { type: string; children: string[]; parents: string[] }>();
    
    // Build table relationships
    tableData.forEach(({ childTableName, childTableType, parentTableName, parentTableType }) => {
      // Add parent table
      if (!tableMap.has(parentTableName)) {
        tableMap.set(parentTableName, { type: parentTableType, children: [], parents: [] });
      }
      
      // Add child table
      if (!tableMap.has(childTableName)) {
        tableMap.set(childTableName, { type: childTableType, children: [], parents: [] });
      }
      
      // Update relationships
      tableMap.get(parentTableName)!.children.push(childTableName);
      tableMap.get(childTableName)!.parents.push(parentTableName);
    });

    // Filter out hidden nodes
    const visibleTables = Array.from(tableMap.keys()).filter(tableName => !hiddenNodes.has(tableName));

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create bypass edges for hidden nodes
    const createBypassEdges = () => {
      const bypassEdges: { source: string; target: string; relationship: string }[] = [];
      
      hiddenNodes.forEach(hiddenNode => {
        const hiddenNodeInfo = tableMap.get(hiddenNode);
        if (!hiddenNodeInfo) return;
        
        // Connect each parent of hidden node to each child of hidden node
        hiddenNodeInfo.parents.forEach(parent => {
          if (!hiddenNodes.has(parent)) { // Only if parent is visible
            hiddenNodeInfo.children.forEach(child => {
              if (!hiddenNodes.has(child)) { // Only if child is visible
                bypassEdges.push({
                  source: parent,
                  target: child,
                  relationship: `via ${hiddenNode}`
                });
              }
            });
          }
        });
      });
      
      return bypassEdges;
    };

    const bypassEdges = createBypassEdges();

    // Create nodes with proper positioning
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    
    // Calculate levels (depth from root nodes)
    const calculateLevel = (tableName: string, level = 0): number => {
      if (visited.has(tableName)) return levels.get(tableName) || 0;
      
      visited.add(tableName);
      const tableInfo = tableMap.get(tableName);
      
      if (!tableInfo || tableInfo.parents.length === 0) {
        levels.set(tableName, level);
        return level;
      }
      
      const maxParentLevel = Math.max(
        ...tableInfo.parents.map(parent => calculateLevel(parent, level))
      );
      
      const currentLevel = maxParentLevel + 1;
      levels.set(tableName, currentLevel);
      return currentLevel;
    };

    visibleTables.forEach(tableName => calculateLevel(tableName));

    // Group tables by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, tableName) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(tableName);
    });

    // Create nodes with calculated positions (only for visible tables)
    levelGroups.forEach((tablesInLevel, level) => {
      tablesInLevel.forEach((tableName, index) => {
        if (!hiddenNodes.has(tableName)) {
          const tableInfo = tableMap.get(tableName)!;
          const savedPosition = state.nodePositions[tableName];
          nodes.push({
            id: tableName,
            type: 'table',
            position: savedPosition || {
              x: level * 300,
              y: index * 120 + (level % 2) * 60,
            },
            data: {
              tableName,
              tableType: tableInfo.type,
              parents: tableInfo.parents.filter(p => !hiddenNodes.has(p)),
              children: tableInfo.children.filter(c => !hiddenNodes.has(c)),
            },
          });
        }
      });
    });

    // Create edges (only between visible nodes)
    let edgeIndex = 0;
    
    // Add original edges between visible nodes
    tableData.forEach(({ childTableName, relationship, parentTableName }) => {
      if (!hiddenNodes.has(childTableName) && !hiddenNodes.has(parentTableName)) {
        edges.push({
          id: `e-${edgeIndex++}`,
          source: parentTableName,
          target: childTableName,
          type: 'relationship',
          data: {
            relationship,
            parentTableName,
            childTableName,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            strokeWidth: 2,
          },
        });
      }
    });

    // Add bypass edges for hidden nodes
    bypassEdges.forEach(({ source, target, relationship }) => {
      edges.push({
        id: `e-bypass-${edgeIndex++}`,
        source,
        target,
        type: 'relationship',
        data: {
          relationship,
          parentTableName: source,
          childTableName: target,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: 2,
          strokeDasharray: '5,5', // Dashed line to indicate bypass
          opacity: 0.7,
        },
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [tableData, hiddenNodes, state.nodePositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes and edges when filtered data changes
  const updateNodesAndEdges = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Trigger update when initialNodes or initialEdges change
  useMemo(() => {
    updateNodesAndEdges();
  }, [updateNodesAndEdges]);

  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault(); // Prevent default context menu
    const newHiddenNodes = new Set(hiddenNodes);
    newHiddenNodes.add(node.id);
    onHiddenNodesChange(newHiddenNodes);
  }, [hiddenNodes, onHiddenNodesChange]);

  return (
    <Card className="w-full h-[600px] overflow-hidden">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeContextMenu={handleNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView={Object.keys(state.nodePositions).length === 0} // Only fit view if no saved positions
          className="bg-background"
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </Card>
  );
};

export default DataLineageGraph;