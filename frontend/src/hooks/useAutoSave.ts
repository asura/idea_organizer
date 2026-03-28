import { useEffect, useRef } from 'react';
import { useGraphStore } from '../store/graphStore.ts';
import { useLayoutStore } from '../store/layoutStore.ts';
import * as nodesApi from '../api/nodes.ts';

const DEBOUNCE_DEFAULT_MS = 1000;
const DEBOUNCE_ANIMATING_MS = 3000;

export function useAutoSave() {
  const nodes = useGraphStore((s) => s.nodes);
  const isAnimating = useLayoutStore((s) => s.isAnimating);
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

    const debounceMs = isAnimating ? DEBOUNCE_ANIMATING_MS : DEBOUNCE_DEFAULT_MS;
    const timer = setTimeout(() => {
      const { trackOp } = useGraphStore.getState();
      for (const [id, pos] of changed) {
        trackOp(
          nodesApi.updateNode(id, {
            position_x: pos.x,
            position_y: pos.y,
          })
        ).catch((err: unknown) => console.error('Failed to save position:', err));
      }
      positionsRef.current = currentPositions;
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [nodes, isAnimating]);
}
