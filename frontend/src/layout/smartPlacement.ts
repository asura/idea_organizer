import type { Node } from '@xyflow/react';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const PADDING = 20;
const MAX_ATTEMPTS = 20;

/**
 * Compute a position for a new node near its connected source node.
 */
export function computeConnectedNodePosition(
  sourceNode: Node,
  existingNodes: Node[],
  direction: 'TB' | 'LR' = 'TB',
): { x: number; y: number } {
  const offsetX = direction === 'LR' ? NODE_WIDTH + 60 : 0;
  const offsetY = direction === 'TB' ? NODE_HEIGHT + 60 : 0;

  const candidate = {
    x: sourceNode.position.x + offsetX,
    y: sourceNode.position.y + offsetY,
  };

  return findNonOverlappingPosition(candidate, existingNodes);
}

/**
 * Find a position near `candidate` that doesn't overlap any existing node.
 * Shifts right, then down in a spiral pattern.
 */
export function findNonOverlappingPosition(
  candidate: { x: number; y: number },
  existingNodes: Node[],
): { x: number; y: number } {
  let pos = { ...candidate };

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (!overlapsAny(pos, existingNodes)) {
      return pos;
    }
    // Shift right first, then wrap down
    if (i % 4 < 2) {
      pos = { x: pos.x + NODE_WIDTH + PADDING, y: pos.y };
    } else {
      pos = { x: candidate.x, y: pos.y + NODE_HEIGHT + PADDING };
    }
  }

  return pos;
}

function overlapsAny(
  pos: { x: number; y: number },
  nodes: Node[],
): boolean {
  for (const node of nodes) {
    if (rectsOverlap(pos, node.position)) {
      return true;
    }
  }
  return false;
}

function rectsOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  return (
    a.x < b.x + NODE_WIDTH + PADDING &&
    a.x + NODE_WIDTH + PADDING > b.x &&
    a.y < b.y + NODE_HEIGHT + PADDING &&
    a.y + NODE_HEIGHT + PADDING > b.y
  );
}
