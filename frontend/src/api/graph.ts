import { api } from './client.ts';
import type { ResearchNodeData } from '../types/node.ts';
import type { ResearchEdgeData } from '../types/edge.ts';

interface GraphData {
  nodes: ResearchNodeData[];
  edges: ResearchEdgeData[];
}

export async function fetchFullGraph(): Promise<GraphData> {
  const { data } = await api.get('/graph');
  return data;
}

export async function fetchNeighborhood(uid: string, depth: number = 1): Promise<GraphData> {
  const { data } = await api.get(`/graph/neighborhood/${uid}`, { params: { depth } });
  return data;
}

export async function searchNodes(q: string, limit: number = 50): Promise<ResearchNodeData[]> {
  const { data } = await api.get('/search', { params: { q, limit } });
  return data;
}
