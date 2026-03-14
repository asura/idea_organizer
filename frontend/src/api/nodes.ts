import { api } from './client.ts';
import type { ResearchNodeData, NodeCreateData, NodeUpdateData } from '../types/node.ts';

export async function fetchNodes(params?: Record<string, string | boolean | number>): Promise<ResearchNodeData[]> {
  const { data } = await api.get('/nodes', { params });
  return data;
}

export async function createNode(payload: NodeCreateData): Promise<ResearchNodeData> {
  const { data } = await api.post('/nodes', payload);
  return data;
}

export async function updateNode(uid: string, payload: NodeUpdateData): Promise<ResearchNodeData> {
  const { data } = await api.patch(`/nodes/${uid}`, payload);
  return data;
}

export async function deleteNode(uid: string): Promise<void> {
  await api.delete(`/nodes/${uid}`);
}
