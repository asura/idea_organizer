import { useCallback, useEffect } from 'react';
import { useGraphStore, useTemporalStore } from '../../store/graphStore';
import { useUIStore } from '../../store/uiStore';
import { NODE_ICONS, NODE_TYPE_LABELS } from '../../utils/colors';
import type { NodeType } from '../../types/node';

const NODE_TYPES: NodeType[] = ['concept', 'paper', 'idea', 'question', 'evidence', 'hypothesis'];
const NODE_BUTTON_COLORS: Record<NodeType, string> = {
  concept: '#3B82F6',
  paper: '#10B981',
  idea: '#F59E0B',
  question: '#EF4444',
  evidence: '#6B7280',
  hypothesis: '#8B5CF6',
};

export function MainToolbar() {
  const addNode = useGraphStore((s) => s.addNode);
  const removeNode = useGraphStore((s) => s.removeNode);
  const removeEdge = useGraphStore((s) => s.removeEdge);
  const nodes = useGraphStore((s) => s.nodes);
  const toggleQuickInput = useUIStore((s) => s.toggleQuickInput);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectedEdgeId = useUIStore((s) => s.selectedEdgeId);
  const clearSelection = useUIStore((s) => s.clearSelection);

  const handleAddNode = useCallback((type: NodeType) => {
    addNode(
      { title: `新しい${NODE_TYPE_LABELS[type]}`, node_type: type, needs_review: true },
      { x: 100 + Math.random() * 400, y: 100 + Math.random() * 400 }
    );
  }, [addNode]);

  const handleDelete = useCallback(() => {
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
  }, [selectedNodeId, selectedEdgeId, nodes, removeNode, removeEdge, clearSelection]);

  const saveToFile = useGraphStore((s) => s.saveToFile);
  const loadFromFile = useGraphStore((s) => s.loadFromFile);

  const handleSave = useCallback(async () => {
    const path = window.prompt('保存先ファイルパス:', '/tmp/graph.json');
    if (!path) return;
    try {
      const msg = await saveToFile(path);
      window.alert(msg);
    } catch {
      window.alert('保存に失敗しました');
    }
  }, [saveToFile]);

  const handleLoad = useCallback(async () => {
    const path = window.prompt('読み込みファイルパス:', '/tmp/graph.json');
    if (!path) return;
    if (!window.confirm('現在のグラフは上書きされます。続行しますか？')) return;
    try {
      await loadFromFile(path);
    } catch {
      window.alert('読み込みに失敗しました');
    }
  }, [loadFromFile]);

  const { undo, redo, pastStates, futureStates } = useTemporalStore();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const hasSelection = selectedNodeId || selectedEdgeId;

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

      {/* Delete button (visible when something is selected) */}
      {hasSelection && (
        <button
          onClick={handleDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            border: '1px solid #DC2626',
            borderRadius: 6,
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="選択中の要素を削除"
        >
          <span>削除</span>
        </button>
      )}

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
        <button
          onClick={() => undo()}
          disabled={pastStates.length === 0}
          style={{
            padding: '4px 8px',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            background: pastStates.length === 0 ? '#F3F4F6' : 'white',
            color: pastStates.length === 0 ? '#D1D5DB' : '#374151',
            fontSize: 12,
            cursor: pastStates.length === 0 ? 'default' : 'pointer',
          }}
          title="元に戻す (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={() => redo()}
          disabled={futureStates.length === 0}
          style={{
            padding: '4px 8px',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            background: futureStates.length === 0 ? '#F3F4F6' : 'white',
            color: futureStates.length === 0 ? '#D1D5DB' : '#374151',
            fontSize: 12,
            cursor: futureStates.length === 0 ? 'default' : 'pointer',
          }}
          title="やり直し (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>

      {/* Save/Load */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '4px 10px',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            background: 'white',
            color: '#374151',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="グラフをファイルに保存"
        >
          保存
        </button>
        <button
          onClick={handleLoad}
          style={{
            padding: '4px 10px',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            background: 'white',
            color: '#374151',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 500,
          }}
          title="ファイルからグラフを読み込み"
        >
          読込
        </button>
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
