import { useEffect, useRef } from 'react';
import { useGraphStore } from '../store/graphStore.ts';
import * as nodesApi from '../api/nodes.ts';

export function useAutoSave() {
  const nodes = useGraphStore((s) => s.nodes);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      for (const node of nodes) {
        const prev = prevPositionsRef.current[node.id];
        if (!prev || prev.x !== node.position.x || prev.y !== node.position.y) {
          // Don't save temp nodes (not yet synced with backend)
          if (!node.id.startsWith('temp-')) {
            nodesApi.updateNode(node.id, {
              position_x: node.position.x,
              position_y: node.position.y,
            }).catch((err: unknown) => console.error('Failed to save position:', err));
          }
        }
        prevPositionsRef.current[node.id] = { ...node.position };
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes]);
}
