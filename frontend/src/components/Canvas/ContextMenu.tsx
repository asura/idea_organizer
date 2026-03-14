import { useEffect, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGraphStore } from '../../store/graphStore';

export function ContextMenu() {
  const contextMenu = useUIStore((s) => s.contextMenu);
  const closeContextMenu = useUIStore((s) => s.closeContextMenu);
  const selectNode = useUIStore((s) => s.selectNode);
  const selectEdge = useUIStore((s) => s.selectEdge);
  const setDetailPanelOpen = useUIStore((s) => s.setDetailPanelOpen);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const nodes = useGraphStore((s) => s.nodes);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu) return null;

  const targetLabel = contextMenu.nodeId
    ? nodes.find((n) => n.id === contextMenu.nodeId)?.data?.title || 'ノード'
    : 'エッジ';
  const targetType = contextMenu.nodeId ? 'ノード' : 'エッジ';

  const handleDelete = () => {
    if (!window.confirm(`「${targetLabel}」を削除しますか？`)) {
      closeContextMenu();
      return;
    }
    if (contextMenu.nodeId) {
      removeNode(contextMenu.nodeId);
    } else if (contextMenu.edgeId) {
      removeEdge(contextMenu.edgeId);
    }
    closeContextMenu();
  };

  const handleEdit = () => {
    if (contextMenu.nodeId) {
      selectNode(contextMenu.nodeId);
    } else if (contextMenu.edgeId) {
      selectEdge(contextMenu.edgeId);
    }
    setDetailPanelOpen(true);
    closeContextMenu();
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: contextMenu.y,
    left: contextMenu.x,
    zIndex: 100,
    background: 'white',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #E5E7EB',
    minWidth: 140,
    padding: '4px 0',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    textAlign: 'left',
  };

  return (
    <div ref={ref} style={menuStyle}>
      <button
        onClick={handleEdit}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        style={itemStyle}
      >
        <span>✏️</span>
        <span>{targetType}を編集</span>
      </button>
      <div style={{ height: 1, background: '#E5E7EB', margin: '2px 0' }} />
      <button
        onClick={handleDelete}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        style={{ ...itemStyle, color: '#DC2626' }}
      >
        <span>🗑️</span>
        <span>{targetType}を削除</span>
      </button>
    </div>
  );
}
