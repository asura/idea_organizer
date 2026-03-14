import { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, type NodeTypes, type EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../../store/graphStore';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';

const nodeTypes: NodeTypes = {
  researchNode: CustomNode,
};

const edgeTypes: EdgeTypes = {
  researchEdge: CustomEdge,
};

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useGraphStore();

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      addNode(
        { title: '\u65B0\u3057\u3044\u30CE\u30FC\u30C9', node_type: 'concept', needs_review: true },
        { x: event.clientX - 250, y: event.clientY - 100 }
      );
    },
    [addNode]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDoubleClick={handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultEdgeOptions={{ type: 'researchEdge' }}
        connectionLineStyle={{ stroke: '#94A3B8', strokeWidth: 2 }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              concept: '#3B82F6',
              paper: '#10B981',
              idea: '#F59E0B',
              question: '#EF4444',
              evidence: '#6B7280',
            };
            const nodeType = (node.data as Record<string, unknown>)?.node_type as string;
            return colors[nodeType] || '#6B7280';
          }}
        />
      </ReactFlow>
    </div>
  );
}
