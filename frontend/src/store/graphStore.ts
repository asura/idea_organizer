import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import type { StoreApi } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
} from '@xyflow/react';
import type { ResearchNodeData, NodeCreateData, NodeUpdateData } from '../types/node.ts';
import type { ResearchEdgeData, EdgeCreateData, EdgeUpdateData } from '../types/edge.ts';
import * as nodesApi from '../api/nodes.ts';
import * as edgesApi from '../api/edges.ts';
import * as graphApi from '../api/graph.ts';

// React Flow node with our data
export type RFNode = Node<ResearchNodeData>;
export type RFEdge = Edge<ResearchEdgeData>;

function toRFNode(data: ResearchNodeData): RFNode {
  return {
    id: data.uid,
    type: 'researchNode',
    position: {
      x: data.position_x || Math.random() * 500,
      y: data.position_y || Math.random() * 500,
    },
    data,
  };
}

function toRFEdge(data: ResearchEdgeData): RFEdge {
  return {
    id: data.uid,
    source: data.source_uid,
    target: data.target_uid,
    type: 'researchEdge',
    data,
  };
}

interface GraphState {
  nodes: RFNode[];
  edges: RFEdge[];
  isLoading: boolean;
  error: string | null;
  pendingOps: number;

  // React Flow change handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Async CRUD actions (API-backed)
  loadGraph: () => Promise<void>;
  addNode: (data: NodeCreateData, position?: { x: number; y: number }) => Promise<RFNode | null>;
  updateNode: (uid: string, data: NodeUpdateData) => Promise<void>;
  removeNode: (uid: string) => Promise<void>;
  addEdge: (data: EdgeCreateData) => Promise<void>;
  updateEdge: (uid: string, data: EdgeUpdateData) => Promise<void>;
  removeEdge: (uid: string) => Promise<void>;

  saveToFile: (filePath: string) => Promise<string>;
  loadFromFile: (filePath: string) => Promise<void>;
  setGraph: (nodes: RFNode[], edges: RFEdge[]) => void;
  setLoading: (loading: boolean) => void;

  // Pending operation tracking (for sync status indicator)
  trackOp: <T>(promise: Promise<T>) => Promise<T>;
}

let nodeIdCounter = 0;
const generateTempId = () => `temp-${++nodeIdCounter}`;

const PERF_ENABLED = import.meta.env.VITE_PERF_LOGGING === 'true';

function perfStart(label: string): () => void {
  if (!PERF_ENABLED) return () => {};
  const start = performance.now();
  return () => {
    const elapsed = performance.now() - start;
    console.log(`[PERF:STORE] ${label} (${elapsed.toFixed(1)}ms)`);
  };
}

// Tracked state for undo/redo (nodes and edges only, ignoring positions/selection)
interface TrackedState {
  nodes: RFNode[];
  edges: RFEdge[];
}

function statesAreEqual(a: TrackedState, b: TrackedState): boolean {
  // Only track structural changes (add/remove/data), ignore position/dragging/selected
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) return false;
  for (let i = 0; i < a.nodes.length; i++) {
    if (a.nodes[i].id !== b.nodes[i].id) return false;
    if (a.nodes[i].data !== b.nodes[i].data) return false;
  }
  for (let i = 0; i < a.edges.length; i++) {
    if (a.edges[i].id !== b.edges[i].id) return false;
    if (a.edges[i].data !== b.edges[i].data) return false;
  }
  return true;
}

export const useGraphStore = create<GraphState>()(temporal((set, get) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  pendingOps: 0,

  trackOp: <T,>(promise: Promise<T>): Promise<T> => {
    set({ pendingOps: get().pendingOps + 1 });
    return promise.finally(() => {
      set({ pendingOps: Math.max(0, get().pendingOps - 1) });
    });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as RFNode[] });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) as RFEdge[] });
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    // Fire and forget - add edge via API
    get().addEdge({
      source_uid: connection.source,
      target_uid: connection.target,
      edge_type: 'RELATES_TO',
      confidence: 'medium',
      status: 'idea',
    });
  },

  loadGraph: async () => {
    const done = perfStart('loadGraph');
    set({ isLoading: true, error: null });
    try {
      const { nodes, edges } = await graphApi.fetchFullGraph();
      set({
        nodes: nodes.map(toRFNode),
        edges: edges.map(toRFEdge),
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load graph:', err);
      set({ isLoading: false, error: 'Failed to load graph' });
    }
    done();
  },

  addNode: async (createData, position) => {
    const done = perfStart('addNode');
    const pos = position || { x: Math.random() * 500, y: Math.random() * 500 };
    // Optimistic: add temp node to UI immediately
    const tempId = generateTempId();
    const now = new Date().toISOString();
    const tempNode: RFNode = {
      id: tempId,
      type: 'researchNode',
      position: pos,
      data: {
        uid: tempId,
        title: createData.title,
        node_type: createData.node_type || 'concept',
        needs_review: createData.needs_review ?? true,
        memo: createData.memo || '',
        tags: createData.tags || [],
        position_x: pos.x,
        position_y: pos.y,
        created_at: now,
        updated_at: now,
      },
    };
    set({ nodes: [...get().nodes, tempNode] });
    try {
      const payload: NodeCreateData = {
        ...createData,
        position_x: pos.x,
        position_y: pos.y,
      };
      const nodeData = await get().trackOp(nodesApi.createNode(payload));
      const realNode = toRFNode(nodeData);
      if (position) {
        realNode.position = position;
      }
      // Replace temp node with real node
      set({
        nodes: get().nodes.map((n) => n.id === tempId ? realNode : n),
      });
      done();
      return realNode;
    } catch (err) {
      console.error('Failed to create node:', err);
      // Keep temp node as fallback
      done();
      return tempNode;
    }
  },

  updateNode: async (uid, data) => {
    const done = perfStart('updateNode');
    // Optimistic update: UI reflects changes immediately
    const prevNodes = get().nodes;
    set({
      nodes: prevNodes.map((n) =>
        n.id === uid
          ? { ...n, data: { ...n.data, ...data, updated_at: new Date().toISOString() } as ResearchNodeData }
          : n
      ),
    });
    try {
      const updated = await get().trackOp(nodesApi.updateNode(uid, data));
      // Reconcile with server response
      set({
        nodes: get().nodes.map((n) =>
          n.id === uid ? { ...n, data: { ...n.data, ...updated } } : n
        ),
      });
    } catch (err) {
      console.error('Failed to update node:', err);
      // Rollback on failure
      set({ nodes: prevNodes });
    }
    done();
  },

  removeNode: async (uid) => {
    try {
      await get().trackOp(nodesApi.deleteNode(uid));
    } catch (err) {
      console.error('Failed to delete node:', err);
    }
    // Remove locally regardless
    set({
      nodes: get().nodes.filter((n) => n.id !== uid),
      edges: get().edges.filter((e) => e.source !== uid && e.target !== uid),
    });
  },

  addEdge: async (createData) => {
    // Optimistic: add temp edge to UI immediately
    const tempId = `edge-${Date.now()}`;
    const now = new Date().toISOString();
    const tempEdge: RFEdge = {
      id: tempId,
      source: createData.source_uid,
      target: createData.target_uid,
      type: 'researchEdge',
      data: {
        uid: tempId,
        source_uid: createData.source_uid,
        target_uid: createData.target_uid,
        edge_type: createData.edge_type || 'RELATES_TO',
        confidence: createData.confidence || 'medium',
        status: createData.status || 'idea',
        note: createData.note || '',
        evidence: createData.evidence || '',
        created_by_thinking: createData.created_by_thinking || 'manual',
        created_at: now,
        updated_at: now,
      },
    };
    set({ edges: [...get().edges, tempEdge] });
    try {
      const edgeData = await get().trackOp(edgesApi.createEdge(createData));
      const realEdge = toRFEdge(edgeData);
      // Replace temp edge with real edge
      set({
        edges: get().edges.map((e) => e.id === tempId ? realEdge : e),
      });
    } catch (err) {
      console.error('Failed to create edge:', err);
      // Keep temp edge as fallback
    }
  },

  updateEdge: async (uid, data) => {
    try {
      const updated = await get().trackOp(edgesApi.updateEdge(uid, data));
      set({
        edges: get().edges.map((e) =>
          e.id === uid ? { ...e, data: { ...e.data, ...updated } } : e
        ),
      });
    } catch (err) {
      console.error('Failed to update edge:', err);
      set({
        edges: get().edges.map((e) =>
          e.id === uid
            ? { ...e, data: { ...e.data, ...data, updated_at: new Date().toISOString() } as ResearchEdgeData }
            : e
        ),
      });
    }
  },

  removeEdge: async (uid) => {
    try {
      await get().trackOp(edgesApi.deleteEdge(uid));
    } catch (err) {
      console.error('Failed to delete edge:', err);
    }
    set({ edges: get().edges.filter((e) => e.id !== uid) });
  },

  saveToFile: async (filePath) => {
    const result = await get().trackOp(graphApi.saveGraphToFile(filePath));
    return result.message;
  },

  loadFromFile: async (filePath) => {
    set({ isLoading: true, error: null });
    try {
      const { nodes, edges } = await graphApi.loadGraphFromFile(filePath);
      set({
        nodes: nodes.map(toRFNode),
        edges: edges.map(toRFEdge),
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load graph from file:', err);
      set({ isLoading: false, error: 'Failed to load graph from file' });
      throw err;
    }
  },

  setGraph: (nodes, edges) => set({ nodes, edges }),
  setLoading: (loading) => set({ isLoading: loading }),
}), {
  partialize: (state): TrackedState => ({ nodes: state.nodes, edges: state.edges }),
  equality: statesAreEqual,
  limit: 50,
}));

// Hook for accessing undo/redo temporal state
export const useTemporalStore = (): TemporalState<TrackedState> =>
  (useGraphStore as unknown as { temporal: StoreApi<TemporalState<TrackedState>> }).temporal.getState();
