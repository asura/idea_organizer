import { useState, useEffect, useCallback } from 'react';
import { useGraphStore } from '../../store/graphStore';
import type { EdgeType, Confidence, EdgeStatus, EdgeUpdateData } from '../../types/edge';

const EDGE_TYPE_OPTIONS: { value: EdgeType; label: string }[] = [
  { value: 'RELATES_TO', label: '関連' },
  { value: 'SUPPORTS', label: '支持' },
  { value: 'CONTRADICTS', label: '矛盾' },
  { value: 'EXTENDS', label: '拡張' },
  { value: 'REQUIRES', label: '必要' },
  { value: 'INSPIRES', label: '着想' },
  { value: 'EVALUATES', label: '評価' },
  { value: 'COMPETES_WITH', label: '競合' },
];

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const STATUS_OPTIONS: { value: EdgeStatus; label: string }[] = [
  { value: 'idea', label: 'アイデア' },
  { value: 'plausible', label: '妥当' },
  { value: 'checked', label: '検証済み' },
  { value: 'rejected', label: '棄却' },
];

interface Props {
  edgeId: string;
}

export function EdgeEditPanel({ edgeId }: Props) {
  const edge = useGraphStore((s) => s.edges.find((e) => e.id === edgeId));
  const nodes = useGraphStore((s) => s.nodes);
  const updateEdge = useGraphStore((s) => s.updateEdge);

  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (edge?.data) {
      setForm({ ...edge.data });
      setDirty(false);
    }
  }, [edgeId, edge?.data?.updated_at]);

  const setField = useCallback((key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!edge?.data || !dirty) return;
    const changes: EdgeUpdateData = {};
    const trackFields = ['edge_type', 'confidence', 'status', 'note', 'evidence'] as const;
    for (const key of trackFields) {
      if (form[key] !== undefined && form[key] !== edge.data[key]) {
        (changes as Record<string, unknown>)[key] = form[key];
      }
    }
    if (Object.keys(changes).length > 0) {
      updateEdge(edgeId, changes);
      setDirty(false);
    }
  }, [form, edge?.data, edgeId, updateEdge, dirty]);

  if (!edge?.data) return null;

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Source / Target (read-only) */}
      <div style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', padding: 8, borderRadius: 6 }}>
        <div><strong>{sourceNode?.data?.title || edge.source}</strong></div>
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>↓</div>
        <div><strong>{targetNode?.data?.title || edge.target}</strong></div>
      </div>

      <Field label="関係タイプ">
        <select
          value={(form.edge_type as string) || 'RELATES_TO'}
          onChange={(e) => setField('edge_type', e.target.value)}
          style={inputStyle}
        >
          {EDGE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
          ))}
        </select>
      </Field>

      <Field label="確信度">
        <select
          value={(form.confidence as string) || 'medium'}
          onChange={(e) => setField('confidence', e.target.value)}
          style={inputStyle}
        >
          {CONFIDENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </Field>

      <Field label="ステータス">
        <select
          value={(form.status as string) || 'idea'}
          onChange={(e) => setField('status', e.target.value)}
          style={inputStyle}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </Field>

      <Field label="メモ">
        <textarea
          value={(form.note as string) || ''}
          onChange={(e) => setField('note', e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
        />
      </Field>

      <Field label="エビデンス">
        <textarea
          value={(form.evidence as string) || ''}
          onChange={(e) => setField('evidence', e.target.value)}
          style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }}
        />
      </Field>

      <button
        onClick={handleSave}
        disabled={!dirty}
        style={{
          padding: '8px 16px',
          background: dirty ? '#3B82F6' : '#D1D5DB',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: dirty ? 'pointer' : 'default',
          fontSize: 13,
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        保存
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
  fontSize: 13,
  color: '#1F2937',
  background: 'white',
  boxSizing: 'border-box',
};
