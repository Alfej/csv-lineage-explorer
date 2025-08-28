import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import TableNode from './TableNode';
import RelationshipEdge from './RelationshipEdge';

interface DataLineageGraphProps {
  csvData: string[][];
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

const DataLineageGraph = ({ csvData }: DataLineageGraphProps) => {
  // Map header names to their indexes (case-insensitive, ignore spaces)
  const headerMap = useMemo(() => {
    if (!csvData.length) return {};
    const headers = csvData[0].map(h => h.toLowerCase().replace(/\s+/g, ''));
    const map: Record<string, number> = {};
    headers.forEach((header, idx) => {
      map[header] = idx;
    });
    return map;
  }, [csvData]);

  // Parse CSV data (skip header row)
  const tableData: TableData[] = useMemo(() => {
    return csvData.slice(1).map(row => ({
      childTableName: row[headerMap['childtablename']] || '',
      childTableType: row[headerMap['childtabletype']] || '',
      relationship: row[headerMap['relationship']] || '',
      parentTableName: row[headerMap['parenttablename']] || '',
      parentTableType: row[headerMap['parenttabletype']] || '',
    }));
  }, [csvData, headerMap]);

  // Create nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
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

    const tables = Array.from(tableMap.keys());
    const nodes: Node[] = [];
    const edges: Edge[] = [];

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

    tables.forEach(tableName => calculateLevel(tableName));

    // Group tables by level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, tableName) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(tableName);
    });

    // Create nodes with calculated positions
    levelGroups.forEach((tablesInLevel, level) => {
      tablesInLevel.forEach((tableName, index) => {
        const tableInfo = tableMap.get(tableName)!;
        nodes.push({
          id: tableName,
          type: 'table',
          position: {
            x: level * 300,
            y: index * 120 + (level % 2) * 60, // Stagger positions
          },
          data: {
            tableName,
            tableType: tableInfo.type,
            parents: tableInfo.parents,
            children: tableInfo.children,
          },
        });
      });
    });

    // Create edges
    tableData.forEach(({ childTableName, relationship, parentTableName }, index) => {
      edges.push({
        id: `e-${index}`,
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
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [tableData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Card className="w-full h-[600px] overflow-hidden">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
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