import { useState, useCallback, useEffect, useRef } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useUIStore } from '../../store/uiStore';
import type { NodeType } from '../../types/node';

const PREFIX_MAP: Record<string, NodeType> = {
  'p:': 'paper',
  'c:': 'concept',
  'i:': 'idea',
  'q:': 'question',
  'e:': 'evidence',
  'h:': 'hypothesis',
};

function parseInput(input: string): { title: string; nodeType: NodeType } {
  const trimmed = input.trim();
  for (const [prefix, type] of Object.entries(PREFIX_MAP)) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return { title: trimmed.slice(prefix.length).trim(), nodeType: type };
    }
  }
  return { title: trimmed, nodeType: 'concept' };
}

export function QuickInput() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addNode = useGraphStore((s) => s.addNode);
  const { quickInputOpen, setQuickInputOpen } = useUIStore();

  useEffect(() => {
    if (quickInputOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [quickInputOpen]);

  // Global keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickInputOpen(!quickInputOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickInputOpen, setQuickInputOpen]);

  const handleSubmit = useCallback(() => {
    if (!value.trim()) return;
    const { title, nodeType } = parseInput(value);
    if (!title) return;

    addNode(
      { title, node_type: nodeType, needs_review: true },
      { x: 200 + Math.random() * 300, y: 150 + Math.random() * 300 }
    );
    setValue('');
    setQuickInputOpen(false);
  }, [value, addNode, setQuickInputOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setQuickInputOpen(false);
      setValue('');
    }
  }, [handleSubmit, setQuickInputOpen]);

  if (!quickInputOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 120,
        zIndex: 100,
      }}
      onClick={() => setQuickInputOpen(false)}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: 480,
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ノード名を入力... (p: 文献, c: 概念, i: アイデア, q: 論点, e: エビデンス, h: 仮説)"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #3B82F6',
            borderRadius: 8,
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 8,
          fontSize: 11,
          color: '#9CA3AF',
          flexWrap: 'wrap',
        }}>
          <span style={{ background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, color: '#3B82F6' }}>c: 概念</span>
          <span style={{ background: '#ECFDF5', padding: '2px 6px', borderRadius: 4, color: '#10B981' }}>p: 文献</span>
          <span style={{ background: '#FFFBEB', padding: '2px 6px', borderRadius: 4, color: '#F59E0B' }}>i: アイデア</span>
          <span style={{ background: '#FEF2F2', padding: '2px 6px', borderRadius: 4, color: '#EF4444' }}>q: 論点</span>
          <span style={{ background: '#F9FAFB', padding: '2px 6px', borderRadius: 4, color: '#6B7280' }}>e: エビデンス</span>
          <span style={{ background: '#F5F3FF', padding: '2px 6px', borderRadius: 4, color: '#8B5CF6' }}>h: 仮説</span>
          <span style={{ marginLeft: 'auto', color: '#D1D5DB' }}>Enter で追加 / Esc で閉じる</span>
        </div>
      </div>
    </div>
  );
}
