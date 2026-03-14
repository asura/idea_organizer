import { create } from 'zustand';
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
import type { ResearchEdgeData, EdgeCreateData } from '../types/edge.ts';
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
  removeEdge: (uid: string) => Promise<void>;

  setGraph: (nodes: RFNode[], edges: RFEdge[]) => void;
  setLoading: (loading: boolean) => void;
}

let nodeIdCounter = 0;
const generateTempId = () => `temp-${++nodeIdCounter}`;

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,

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
  },

  addNode: async (createData, position) => {
    try {
      const payload: NodeCreateData = {
        ...createData,
        position_x: position?.x || Math.random() * 500,
        position_y: position?.y || Math.random() * 500,
      };
      const nodeData = await nodesApi.createNode(payload);
      const rfNode = toRFNode(nodeData);
      if (position) {
        rfNode.position = position;
      }
      set({ nodes: [...get().nodes, rfNode] });
      return rfNode;
    } catch (err) {
      console.error('Failed to create node:', err);
      // Fallback: create locally with temp ID
      const tempId = generateTempId();
      const now = new Date().toISOString();
      const rfNode: RFNode = {
        id: tempId,
        type: 'researchNode',
        position: position || { x: Math.random() * 500, y: Math.random() * 500 },
        data: {
          uid: tempId,
          title: createData.title,
          node_type: createData.node_type || 'concept',
          needs_review: createData.needs_review ?? true,
          memo: createData.memo || '',
          tags: createData.tags || [],
          position_x: position?.x || 0,
          position_y: position?.y || 0,
          created_at: now,
          updated_at: now,
        },
      };
      set({ nodes: [...get().nodes, rfNode] });
      return rfNode;
    }
  },

  updateNode: async (uid, data) => {
    try {
      const updated = await nodesApi.updateNode(uid, data);
      set({
        nodes: get().nodes.map((n) =>
          n.id === uid ? { ...n, data: { ...n.data, ...updated } } : n
        ),
      });
    } catch (err) {
      console.error('Failed to update node:', err);
      // Update locally anyway
      set({
        nodes: get().nodes.map((n) =>
          n.id === uid
            ? { ...n, data: { ...n.data, ...data, updated_at: new Date().toISOString() } as ResearchNodeData }
            : n
        ),
      });
    }
  },

  removeNode: async (uid) => {
    try {
      await nodesApi.deleteNode(uid);
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
    try {
      const edgeData = await edgesApi.createEdge(createData);
      const rfEdge = toRFEdge(edgeData);
      set({ edges: [...get().edges, rfEdge] });
    } catch (err) {
      console.error('Failed to create edge:', err);
      // Fallback: create locally
      const tempId = `edge-${Date.now()}`;
      const now = new Date().toISOString();
      const rfEdge: RFEdge = {
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
      set({ edges: [...get().edges, rfEdge] });
    }
  },

  removeEdge: async (uid) => {
    try {
      await edgesApi.deleteEdge(uid);
    } catch (err) {
      console.error('Failed to delete edge:', err);
    }
    set({ edges: get().edges.filter((e) => e.id !== uid) });
  },

  setGraph: (nodes, edges) => set({ nodes, edges }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
