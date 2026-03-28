import type { NodeType } from '../types/node';
import type { Confidence, EdgeStatus } from '../types/edge';

// ノードタイプ別の色
export const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  concept: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  paper: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
  idea: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
  question: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' },
  evidence: { bg: '#F9FAFB', border: '#6B7280', text: '#374151' },
  hypothesis: { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6' },
  decision: { bg: '#FFF7ED', border: '#EA580C', text: '#9A3412' },
};

// ノードタイプ別アイコン
export const NODE_ICONS: Record<NodeType, string> = {
  concept: '\u{1F4A1}',
  paper: '\u{1F4C4}',
  idea: '\u{26A1}',
  question: '\u{2753}',
  evidence: '\u{1F4CC}',
  hypothesis: '\u{1F9EA}',
  decision: '\u2696\uFE0F',
};

// ノードタイプ別の日本語ラベル
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  concept: '\u6982\u5FF5',
  paper: '\u6587\u732E',
  idea: '\u30A2\u30A4\u30C7\u30A2',
  question: '\u8AD6\u70B9',
  evidence: '\u30A8\u30D3\u30C7\u30F3\u30B9',
  hypothesis: '\u4EEE\u8AAC',
  decision: '\u5224\u65AD',
};

// Confidence → 線のスタイル
export const CONFIDENCE_STYLES: Record<Confidence, string> = {
  high: '2px solid',
  medium: '2px dashed',
  low: '2px dotted',
};

// Status → 色
export const STATUS_COLORS: Record<EdgeStatus, string> = {
  idea: '#9CA3AF',
  plausible: '#3B82F6',
  checked: '#10B981',
  rejected: '#EF4444',
};
