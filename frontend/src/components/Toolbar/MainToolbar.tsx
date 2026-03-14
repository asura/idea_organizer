import { useCallback } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useUIStore } from '../../store/uiStore';
import { NODE_ICONS, NODE_TYPE_LABELS } from '../../utils/colors';
import type { NodeType } from '../../types/node';

const NODE_TYPES: NodeType[] = ['concept', 'paper', 'idea', 'question', 'evidence'];
const NODE_BUTTON_COLORS: Record<NodeType, string> = {
  concept: '#3B82F6',
  paper: '#10B981',
  idea: '#F59E0B',
  question: '#EF4444',
  evidence: '#6B7280',
};

export function MainToolbar() {
  const addNode = useGraphStore((s) => s.addNode);
  const toggleQuickInput = useUIStore((s) => s.toggleQuickInput);

  const handleAddNode = useCallback((type: NodeType) => {
    addNode(
      { title: `新しい${NODE_TYPE_LABELS[type]}`, node_type: type, needs_review: true },
      { x: 100 + Math.random() * 400, y: 100 + Math.random() * 400 }
    );
  }, [addNode]);

  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: 'white',
      borderBottom: '1px solid #E5E7EB',
      gap: 12,
      zIndex: 10,
    }}>
      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1F2937', marginRight: 16 }}>
        Research Idea Organizer
      </div>

      {/* Add node buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => handleAddNode(type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              border: `1px solid ${NODE_BUTTON_COLORS[type]}`,
              borderRadius: 6,
              background: 'white',
              color: NODE_BUTTON_COLORS[type],
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 500,
            }}
            title={`${NODE_TYPE_LABELS[type]}を追加`}
          >
            <span>{NODE_ICONS[type]}</span>
            <span>{NODE_TYPE_LABELS[type]}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* QuickInput toggle */}
      <button
        onClick={toggleQuickInput}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: 6,
          background: '#F9FAFB',
          cursor: 'pointer',
          fontSize: 12,
          color: '#6B7280',
        }}
      >
        <span>⌘K</span>
        <span>クイック入力</span>
      </button>
    </div>
  );
}
