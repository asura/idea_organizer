import { useUIStore } from '../../store/uiStore';
import { useGraphStore } from '../../store/graphStore';
import { NodeEditPanel } from './NodeEditPanel';
import { EdgeEditPanel } from './EdgeEditPanel';

export function DetailPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectedEdgeId = useUIStore((s) => s.selectedEdgeId);
  const detailPanelOpen = useUIStore((s) => s.detailPanelOpen);
  const setDetailPanelOpen = useUIStore((s) => s.setDetailPanelOpen);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const nodes = useGraphStore((s) => s.nodes);

  if (!detailPanelOpen || (!selectedNodeId && !selectedEdgeId)) return null;

  const handleClose = () => {
    setDetailPanelOpen(false);
  };

  const handleDelete = () => {
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      const label = node?.data?.title || 'ノード';
      if (!window.confirm(`「${label}」を削除しますか？`)) return;
      removeNode(selectedNodeId);
      clearSelection();
    } else if (selectedEdgeId) {
      if (!window.confirm('このエッジを削除しますか？')) return;
      removeEdge(selectedEdgeId);
      clearSelection();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        height: '100%',
        width: 320,
        background: 'white',
        borderLeft: '1px solid #E5E7EB',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
          {selectedNodeId ? 'ノード編集' : 'エッジ編集'}
        </span>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: '0 4px',
          }}
          title="閉じる"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {selectedNodeId && <NodeEditPanel nodeId={selectedNodeId} />}
        {selectedEdgeId && <EdgeEditPanel edgeId={selectedEdgeId} />}
      </div>

      {/* Footer with delete */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <button
          onClick={handleDelete}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #DC2626',
            borderRadius: 6,
            color: '#DC2626',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {selectedNodeId ? 'ノードを削除' : 'エッジを削除'}
        </button>
      </div>
    </div>
  );
}
