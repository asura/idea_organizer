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

export async function saveGraphToFile(filePath: string): Promise<{ message: string }> {
  const { data } = await api.post('/graph/save', { file_path: filePath });
  return data;
}

export async function loadGraphFromFile(filePath: string): Promise<GraphData> {
  const { data } = await api.post('/graph/load', { file_path: filePath });
  return data;
}
