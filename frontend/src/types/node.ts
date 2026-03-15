// ノードタイプ
export type NodeType = 'concept' | 'paper' | 'idea' | 'question' | 'evidence' | 'hypothesis';

// 研究ノード (backendのNodeResponseに対応)
export interface ResearchNodeData {
  [key: string]: unknown;
  uid: string;
  title: string;
  node_type: NodeType;
  needs_review: boolean;
  memo: string;
  tags: string[];
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
  // Concept
  aliases?: string[];
  description?: string;
  domain?: string;
  importance?: string;
  concept_status?: string;
  // Paper
  year?: number;
  authors?: string[];
  venue?: string;
  url?: string;
  summary?: string;
  contribution?: string;
  limitations?: string;
  read_status?: string;
  // Idea
  motivation?: string;
  novelty_claim?: string;
  feasibility_note?: string;
  priority?: string;
  idea_status?: string;
  // Question
  category?: string;
  urgency?: string;
  question_status?: string;
  // Evidence
  content?: string;
  source?: string;
  reliability?: string;
  evidence_date?: string;
  linked_excerpt?: string;
  // Hypothesis
  statement?: string;
  basis?: string;
  testability_note?: string;
  confidence_level?: string;
  hypothesis_status?: string;
}

export interface NodeCreateData {
  title: string;
  node_type?: NodeType;
  needs_review?: boolean;
  memo?: string;
  tags?: string[];
  position_x?: number;
  position_y?: number;
  [key: string]: unknown;
}

export interface NodeUpdateData {
  title?: string;
  node_type?: NodeType;
  needs_review?: boolean;
  memo?: string;
  tags?: string[];
  position_x?: number;
  position_y?: number;
  [key: string]: unknown;
}
