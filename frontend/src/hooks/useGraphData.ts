import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore.ts';

export function useGraphData() {
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const isLoading = useGraphStore((s) => s.isLoading);
  const error = useGraphStore((s) => s.error);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  return { isLoading, error };
}
