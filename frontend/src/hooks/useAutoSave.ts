import { useEffect, useRef } from 'react';
import { useGraphStore } from '../store/graphStore.ts';
import * as nodesApi from '../api/nodes.ts';

export function useAutoSave() {
  const nodes = useGraphStore((s) => s.nodes);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    // Extract current positions
    const currentPositions: Record<string, { x: number; y: number }> = {};
    for (const node of nodes) {
      currentPositions[node.id] = { x: node.position.x, y: node.position.y };
    }

    // Find nodes whose position actually changed (skip temp nodes)
    const changed = Object.entries(currentPositions).filter(([id, pos]) => {
      const prev = positionsRef.current[id];
      return prev && (prev.x !== pos.x || prev.y !== pos.y) && !id.startsWith('temp-');
    });

    if (changed.length === 0) {
      // Update ref for new nodes (first seen), but don't send requests
      positionsRef.current = currentPositions;
      return;
    }

    const timer = setTimeout(() => {
      for (const [id, pos] of changed) {
        nodesApi.updateNode(id, {
          position_x: pos.x,
          position_y: pos.y,
        }).catch((err: unknown) => console.error('Failed to save position:', err));
      }
      positionsRef.current = currentPositions;
    }, 1000);

    return () => clearTimeout(timer);
  }, [nodes]);
}
