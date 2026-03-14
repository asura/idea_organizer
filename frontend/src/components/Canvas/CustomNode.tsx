import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ResearchNodeData } from '../../types/node';
import { NODE_COLORS, NODE_ICONS, NODE_TYPE_LABELS } from '../../utils/colors';
import { useUIStore } from '../../store/uiStore';

export function CustomNode({ data, id, selected }: NodeProps) {
  // Cast data since React Flow types are generic
  const nodeData = data as unknown as ResearchNodeData;
  const colors = NODE_COLORS[nodeData.node_type];
  const icon = NODE_ICONS[nodeData.node_type];
  const label = NODE_TYPE_LABELS[nodeData.node_type];
  const selectNode = useUIStore((s) => s.selectNode);

  return (
    <div
      onClick={() => selectNode(id)}
      style={{
        minWidth: 180,
        maxWidth: 280,
        background: colors.bg,
        border: `2px solid ${selected ? '#2563EB' : colors.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        opacity: nodeData.needs_review ? 0.75 : 1,
        boxShadow: selected ? '0 0 0 2px #2563EB40' : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span>{icon}</span>
        <span style={{ color: colors.text, fontSize: 11, fontWeight: 500 }}>{label}</span>
        {nodeData.needs_review && (
          <span style={{
            fontSize: 9,
            background: '#FEF3C7',
            color: '#92400E',
            padding: '1px 4px',
            borderRadius: 3,
            marginLeft: 'auto',
          }}>
            {'\u8981\u78BA\u8A8D'}
          </span>
        )}
      </div>
      {/* Title */}
      <div style={{ fontWeight: 600, color: '#1F2937', wordBreak: 'break-word' }}>
        {nodeData.title}
      </div>
      {/* Tags */}
      {nodeData.tags && nodeData.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
          {nodeData.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontSize: 10,
              background: '#E5E7EB',
              color: '#4B5563',
              padding: '1px 4px',
              borderRadius: 3,
            }}>{tag}</span>
          ))}
        </div>
      )}

      <Handle type="target" position={Position.Top} style={{ background: colors.border }} />
      <Handle type="source" position={Position.Bottom} style={{ background: colors.border }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: colors.border }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: colors.border }} />
    </div>
  );
}
