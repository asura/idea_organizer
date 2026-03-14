export type EdgeType =
  | 'RELATES_TO'
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'EXTENDS'
  | 'REQUIRES'
  | 'INSPIRES'
  | 'EVALUATES'
  | 'COMPETES_WITH';

export type Confidence = 'high' | 'medium' | 'low';
export type EdgeStatus = 'idea' | 'plausible' | 'checked' | 'rejected';

export interface ResearchEdgeData {
  [key: string]: unknown;
  uid: string;
  source_uid: string;
  target_uid: string;
  edge_type: EdgeType;
  confidence: Confidence;
  status: EdgeStatus;
  note: string;
  evidence: string;
  created_by_thinking: string;
  created_at: string;
  updated_at: string;
}

export interface EdgeCreateData {
  source_uid: string;
  target_uid: string;
  edge_type?: EdgeType;
  confidence?: Confidence;
  status?: EdgeStatus;
  note?: string;
  evidence?: string;
  created_by_thinking?: string;
}

export interface EdgeUpdateData {
  edge_type?: EdgeType;
  confidence?: Confidence;
  status?: EdgeStatus;
  note?: string;
  evidence?: string;
}
