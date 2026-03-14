import { useState, useEffect, useCallback } from 'react';
import { useGraphStore, type RFNode } from '../../store/graphStore';
import type { NodeType, NodeUpdateData } from '../../types/node';

const NODE_TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: 'concept', label: '概念' },
  { value: 'paper', label: '文献' },
  { value: 'idea', label: 'アイデア' },
  { value: 'question', label: '論点' },
  { value: 'evidence', label: 'エビデンス' },
];

const IMPORTANCE_OPTIONS = ['high', 'medium', 'low'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const URGENCY_OPTIONS = ['high', 'medium', 'low'];
const RELIABILITY_OPTIONS = ['high', 'medium', 'low'];
const READ_STATUS_OPTIONS = ['unread', 'skimmed', 'read', 'studied'];
const STATUS_OPTIONS = ['draft', 'active', 'archived', 'resolved'];

interface Props {
  nodeId: string;
}

export function NodeEditPanel({ nodeId }: Props) {
  const node = useGraphStore((s) => s.nodes.find((n) => n.id === nodeId)) as RFNode | undefined;
  const updateNode = useGraphStore((s) => s.updateNode);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (node?.data) {
      setForm({ ...node.data });
      setDirty(false);
    }
  }, [nodeId, node?.data?.updated_at]);

  const setField = useCallback((key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!node?.data || !dirty) return;
    const changes: NodeUpdateData = {};
    for (const [key, value] of Object.entries(form)) {
      if (key === 'uid' || key === 'created_at' || key === 'updated_at') continue;
      if (JSON.stringify(value) !== JSON.stringify(node.data[key])) {
        changes[key] = value;
      }
    }
    if (Object.keys(changes).length > 0) {
      updateNode(nodeId, changes);
      setDirty(false);
    }
  }, [form, node?.data, nodeId, updateNode, dirty]);

  if (!node?.data) return null;

  const nodeType = (form.node_type || node.data.node_type) as NodeType;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Common fields */}
      <Field label="タイトル">
        <input
          type="text"
          value={(form.title as string) || ''}
          onChange={(e) => setField('title', e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="タイプ">
        <select
          value={nodeType}
          onChange={(e) => setField('node_type', e.target.value)}
          style={inputStyle}
        >
          {NODE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </Field>

      <Field label="要確認">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={(form.needs_review as boolean) ?? false}
            onChange={(e) => setField('needs_review', e.target.checked)}
          />
          needs_review
        </label>
      </Field>

      <Field label="メモ">
        <textarea
          value={(form.memo as string) || ''}
          onChange={(e) => setField('memo', e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
        />
      </Field>

      <Field label="タグ">
        <input
          type="text"
          value={((form.tags as string[]) || []).join(', ')}
          onChange={(e) => setField('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
          placeholder="カンマ区切り"
          style={inputStyle}
        />
      </Field>

      {/* Type-specific fields */}
      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8, fontWeight: 600 }}>
          {NODE_TYPE_OPTIONS.find((o) => o.value === nodeType)?.label}固有フィールド
        </div>
        {nodeType === 'concept' && <ConceptFields form={form} setField={setField} />}
        {nodeType === 'paper' && <PaperFields form={form} setField={setField} />}
        {nodeType === 'idea' && <IdeaFields form={form} setField={setField} />}
        {nodeType === 'question' && <QuestionFields form={form} setField={setField} />}
        {nodeType === 'evidence' && <EvidenceFields form={form} setField={setField} />}
      </div>

      {/* Save button */}
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

// Type-specific field groups
function ConceptFields({ form, setField }: FieldGroupProps) {
  return (
    <>
      <Field label="説明">
        <textarea value={(form.description as string) || ''} onChange={(e) => setField('description', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
      </Field>
      <Field label="ドメイン">
        <input type="text" value={(form.domain as string) || ''} onChange={(e) => setField('domain', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="重要度">
        <select value={(form.importance as string) || ''} onChange={(e) => setField('importance', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {IMPORTANCE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="ステータス">
        <select value={(form.concept_status as string) || ''} onChange={(e) => setField('concept_status', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="エイリアス">
        <input type="text" value={((form.aliases as string[]) || []).join(', ')} onChange={(e) => setField('aliases', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} placeholder="カンマ区切り" style={inputStyle} />
      </Field>
    </>
  );
}

function PaperFields({ form, setField }: FieldGroupProps) {
  return (
    <>
      <Field label="年">
        <input type="number" value={(form.year as number) || ''} onChange={(e) => setField('year', e.target.value ? Number(e.target.value) : null)} style={inputStyle} />
      </Field>
      <Field label="著者">
        <input type="text" value={((form.authors as string[]) || []).join(', ')} onChange={(e) => setField('authors', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} placeholder="カンマ区切り" style={inputStyle} />
      </Field>
      <Field label="学会/ジャーナル">
        <input type="text" value={(form.venue as string) || ''} onChange={(e) => setField('venue', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="URL">
        <input type="url" value={(form.url as string) || ''} onChange={(e) => setField('url', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="要約">
        <textarea value={(form.summary as string) || ''} onChange={(e) => setField('summary', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
      </Field>
      <Field label="貢献">
        <textarea value={(form.contribution as string) || ''} onChange={(e) => setField('contribution', e.target.value)} style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} />
      </Field>
      <Field label="制約">
        <textarea value={(form.limitations as string) || ''} onChange={(e) => setField('limitations', e.target.value)} style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} />
      </Field>
      <Field label="読了状況">
        <select value={(form.read_status as string) || ''} onChange={(e) => setField('read_status', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {READ_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
    </>
  );
}

function IdeaFields({ form, setField }: FieldGroupProps) {
  return (
    <>
      <Field label="動機">
        <textarea value={(form.motivation as string) || ''} onChange={(e) => setField('motivation', e.target.value)} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} />
      </Field>
      <Field label="新規性">
        <textarea value={(form.novelty_claim as string) || ''} onChange={(e) => setField('novelty_claim', e.target.value)} style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} />
      </Field>
      <Field label="実現可能性">
        <textarea value={(form.feasibility_note as string) || ''} onChange={(e) => setField('feasibility_note', e.target.value)} style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} />
      </Field>
      <Field label="優先度">
        <select value={(form.priority as string) || ''} onChange={(e) => setField('priority', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="ステータス">
        <select value={(form.idea_status as string) || ''} onChange={(e) => setField('idea_status', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
    </>
  );
}

function QuestionFields({ form, setField }: FieldGroupProps) {
  return (
    <>
      <Field label="カテゴリ">
        <input type="text" value={(form.category as string) || ''} onChange={(e) => setField('category', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="緊急度">
        <select value={(form.urgency as string) || ''} onChange={(e) => setField('urgency', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {URGENCY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="ステータス">
        <select value={(form.question_status as string) || ''} onChange={(e) => setField('question_status', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
    </>
  );
}

function EvidenceFields({ form, setField }: FieldGroupProps) {
  return (
    <>
      <Field label="内容">
        <textarea value={(form.content as string) || ''} onChange={(e) => setField('content', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
      </Field>
      <Field label="情報源">
        <input type="text" value={(form.source as string) || ''} onChange={(e) => setField('source', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="信頼性">
        <select value={(form.reliability as string) || ''} onChange={(e) => setField('reliability', e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {RELIABILITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="日付">
        <input type="date" value={(form.evidence_date as string) || ''} onChange={(e) => setField('evidence_date', e.target.value)} style={inputStyle} />
      </Field>
      <Field label="引用箇所">
        <textarea value={(form.linked_excerpt as string) || ''} onChange={(e) => setField('linked_excerpt', e.target.value)} style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} />
      </Field>
    </>
  );
}

// Shared types and styles
interface FieldGroupProps {
  form: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
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
