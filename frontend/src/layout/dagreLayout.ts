import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 80;

export function computeDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR',
): Map<string, { x: number; y: number }> {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  for (const node of nodes) {
    g.setNode(node.id, { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    // dagre returns center coordinates; convert to React Flow's top-left origin
    positions.set(node.id, {
      x: dagreNode.x - DEFAULT_NODE_WIDTH / 2,
      y: dagreNode.y - DEFAULT_NODE_HEIGHT / 2,
    });
  }

  return positions;
}
