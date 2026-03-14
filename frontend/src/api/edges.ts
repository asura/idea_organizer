import { api } from './client.ts';
import type { ResearchEdgeData, EdgeCreateData, EdgeUpdateData } from '../types/edge.ts';

export async function fetchEdges(): Promise<ResearchEdgeData[]> {
  const { data } = await api.get('/edges');
  return data;
}

export async function createEdge(payload: EdgeCreateData): Promise<ResearchEdgeData> {
  const { data } = await api.post('/edges', payload);
  return data;
}

export async function updateEdge(uid: string, payload: EdgeUpdateData): Promise<ResearchEdgeData> {
  const { data } = await api.patch(`/edges/${uid}`, payload);
  return data;
}

export async function deleteEdge(uid: string): Promise<void> {
  await api.delete(`/edges/${uid}`);
}
