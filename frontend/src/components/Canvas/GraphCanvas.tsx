import { useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  type NodeTypes, type EdgeTypes, type Node, type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../../store/graphStore';
import { useUIStore } from '../../store/uiStore';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { ContextMenu } from './ContextMenu';

const nodeTypes: NodeTypes = {
  researchNode: CustomNode,
};

const edgeTypes: EdgeTypes = {
  researchEdge: CustomEdge,
};

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, removeNode, removeEdge } = useGraphStore();
  const { openContextMenu, closeContextMenu, contextMenu, clearSelection } = useUIStore();

  const handlePaneDoubleClick = useCallback(
    (event: ReactMouseEvent) => {
      addNode(
        { title: '新しいノード', node_type: 'concept', needs_review: true },
        { x: event.clientX - 250, y: event.clientY - 100 }
      );
    },
    [addNode]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        removeNode(node.id);
      }
    },
    [removeNode]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        removeEdge(edge.id);
      }
    },
    [removeEdge]
  );

  const handleNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      event.preventDefault();
      openContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    },
    [openContextMenu]
  );

  const handleEdgeContextMenu = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      event.preventDefault();
      openContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
    },
    [openContextMenu]
  );

  const handlePaneClick = useCallback(() => {
    closeContextMenu();
    clearSelection();
  }, [closeContextMenu, clearSelection]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDoubleClick={handlePaneDoubleClick}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
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
      {contextMenu && <ContextMenu />}
    </div>
  );
}
