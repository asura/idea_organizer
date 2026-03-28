import { useEffect, useRef, useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';
import { useLayoutStore } from '../store/layoutStore';
import { createForceSimulation, type ForceEngine, type SimNode } from '../layout/forceSimulation';
import type { NodeChange } from '@xyflow/react';

export function useForceLayout() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const forceEnabled = useLayoutStore((s) => s.forceEnabled);
  const forceConfig = useLayoutStore((s) => s.forceConfig);
  const setAnimating = useLayoutStore((s) => s.setAnimating);

  const engineRef = useRef<ForceEngine | null>(null);
  // Track node/edge counts to detect structural changes
  const prevStructureRef = useRef<{ nodeIds: string; edgeIds: string }>({ nodeIds: '', edgeIds: '' });

  // Tick handler: convert positions to React Flow node changes
  const handleTick = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      const changes: NodeChange[] = [];
      for (const [id, pos] of positions) {
        changes.push({ type: 'position', id, position: pos });
      }
      if (changes.length > 0) {
        onNodesChange(changes);
      }
    },
    [onNodesChange],
  );

  // Start/stop simulation when forceEnabled toggles
  useEffect(() => {
    if (!forceEnabled) {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
        setAnimating(false);
      }
      return;
    }

    // Build initial sim nodes from current React Flow nodes
    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));

    const simLinks = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const engine = createForceSimulation(simNodes, simLinks, forceConfig, handleTick);
    engineRef.current = engine;
    setAnimating(true);

    // Mark structure for change detection
    prevStructureRef.current = {
      nodeIds: nodes.map((n) => n.id).sort().join(','),
      edgeIds: edges.map((e) => e.id).sort().join(','),
    };

    return () => {
      engine.stop();
      engineRef.current = null;
      setAnimating(false);
    };
    // Only recreate simulation when force is toggled or config changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceEnabled, forceConfig]);

  // Sync structural changes (add/remove nodes/edges) into running simulation
  useEffect(() => {
    if (!forceEnabled || !engineRef.current) return;

    const nodeIds = nodes.map((n) => n.id).sort().join(',');
    const edgeIds = edges.map((e) => e.id).sort().join(',');

    if (
      nodeIds === prevStructureRef.current.nodeIds &&
      edgeIds === prevStructureRef.current.edgeIds
    ) {
      return; // No structural change
    }

    prevStructureRef.current = { nodeIds, edgeIds };

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));

    const simLinks = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    engineRef.current.updateNodes(simNodes, simLinks);
  }, [forceEnabled, nodes, edges]);

  // Expose pin/unpin for drag handlers
  const pinNode = useCallback((id: string, x: number, y: number) => {
    engineRef.current?.pinNode(id, x, y);
  }, []);

  const unpinNode = useCallback((id: string) => {
    engineRef.current?.unpinNode(id);
  }, []);

  return { pinNode, unpinNode };
}
