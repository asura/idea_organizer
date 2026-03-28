import { useCallback, useRef, useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useLayoutStore } from '../../store/layoutStore';
import { computeDagreLayout } from '../../layout/dagreLayout';
import type { NodeChange } from '@xyflow/react';

const ANIMATION_DURATION_MS = 300;
const ANIMATION_FPS = 60;

export function LayoutControls() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const dagreDirection = useLayoutStore((s) => s.dagreDirection);
  const setDagreDirection = useLayoutStore((s) => s.setDagreDirection);
  const isAnimating = useLayoutStore((s) => s.isAnimating);
  const setAnimating = useLayoutStore((s) => s.setAnimating);

  const [showDirectionMenu, setShowDirectionMenu] = useState(false);
  const animFrameRef = useRef<number>(0);

  const applyDagreLayout = useCallback(() => {
    if (nodes.length === 0 || isAnimating) return;

    const targetPositions = computeDagreLayout(nodes, edges, dagreDirection);

    // Capture start positions
    const startPositions = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      startPositions.set(node.id, { x: node.position.x, y: node.position.y });
    }

    // Animate from start to target positions
    setAnimating(true);
    const startTime = performance.now();
    const totalFrames = Math.ceil((ANIMATION_DURATION_MS / 1000) * ANIMATION_FPS);
    let frame = 0;

    const animate = () => {
      frame++;
      const elapsed = performance.now() - startTime;
      const rawT = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      // ease-out cubic
      const t = 1 - Math.pow(1 - rawT, 3);

      const changes: NodeChange[] = [];
      for (const node of nodes) {
        const start = startPositions.get(node.id);
        const target = targetPositions.get(node.id);
        if (!start || !target) continue;

        changes.push({
          type: 'position',
          id: node.id,
          position: {
            x: start.x + (target.x - start.x) * t,
            y: start.y + (target.y - start.y) * t,
          },
        });
      }

      onNodesChange(changes);

      if (frame < totalFrames && rawT < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure final positions are exact
        const finalChanges: NodeChange[] = [];
        for (const node of nodes) {
          const target = targetPositions.get(node.id);
          if (!target) continue;
          finalChanges.push({ type: 'position', id: node.id, position: target });
        }
        onNodesChange(finalChanges);
        setAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [nodes, edges, dagreDirection, isAnimating, onNodesChange, setAnimating]);

  const handleDirectionChange = useCallback((dir: 'TB' | 'LR') => {
    setDagreDirection(dir);
    setShowDirectionMenu(false);
  }, [setDagreDirection]);

  return (
    <div style={{ display: 'flex', gap: 2, position: 'relative' }}>
      <button
        onClick={applyDagreLayout}
        disabled={isAnimating || nodes.length === 0}
        style={{
          padding: '4px 10px',
          border: '1px solid #6366F1',
          borderRadius: '6px 0 0 6px',
          background: isAnimating ? '#E0E7FF' : 'white',
          color: isAnimating ? '#A5B4FC' : '#6366F1',
          fontSize: 12,
          cursor: isAnimating || nodes.length === 0 ? 'default' : 'pointer',
          fontWeight: 500,
        }}
        title={`自動整列 (${dagreDirection === 'TB' ? '上→下' : '左→右'})`}
      >
        {dagreDirection === 'TB' ? '↕' : '↔'} 整列
      </button>
      <button
        onClick={() => setShowDirectionMenu((v) => !v)}
        style={{
          padding: '4px 6px',
          border: '1px solid #6366F1',
          borderLeft: 'none',
          borderRadius: '0 6px 6px 0',
          background: 'white',
          color: '#6366F1',
          fontSize: 10,
          cursor: 'pointer',
        }}
        title="整列方向を選択"
      >
        ▾
      </button>

      {showDirectionMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
            minWidth: 120,
          }}
        >
          <button
            onClick={() => handleDirectionChange('TB')}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              background: dagreDirection === 'TB' ? '#EEF2FF' : 'transparent',
              color: '#374151',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            ↕ 上→下 (TB)
          </button>
          <button
            onClick={() => handleDirectionChange('LR')}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              border: 'none',
              background: dagreDirection === 'LR' ? '#EEF2FF' : 'transparent',
              color: '#374151',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            ↔ 左→右 (LR)
          </button>
        </div>
      )}
      <ForceControls />
    </div>
  );
}

function ForceControls() {
  const forceEnabled = useLayoutStore((s) => s.forceEnabled);
  const toggleForce = useLayoutStore((s) => s.toggleForce);
  const forceConfig = useLayoutStore((s) => s.forceConfig);
  const setForceConfig = useLayoutStore((s) => s.setForceConfig);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button
        onClick={toggleForce}
        style={{
          padding: '4px 10px',
          border: `1px solid ${forceEnabled ? '#059669' : '#9CA3AF'}`,
          borderRadius: 6,
          background: forceEnabled ? '#ECFDF5' : 'white',
          color: forceEnabled ? '#059669' : '#6B7280',
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 500,
          marginLeft: 4,
        }}
        title={forceEnabled ? '力学シミュレーション: ON' : '力学シミュレーション: OFF'}
      >
        {forceEnabled ? '~ Force ON' : '~ Force OFF'}
      </button>

      {forceEnabled && (
        <button
          onClick={() => setShowSettings((v) => !v)}
          style={{
            padding: '4px 6px',
            border: '1px solid #9CA3AF',
            borderRadius: 6,
            background: showSettings ? '#F3F4F6' : 'white',
            color: '#6B7280',
            fontSize: 12,
            cursor: 'pointer',
            marginLeft: 2,
          }}
          title="Force パラメータ設定"
        >
          ⚙
        </button>
      )}

      {showSettings && forceEnabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            padding: 12,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 50,
            minWidth: 240,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            Force パラメータ
          </div>
          <ForceSlider
            label="中心引力"
            value={forceConfig.centerStrength}
            min={0.01}
            max={0.2}
            step={0.01}
            onChange={(v) => setForceConfig({ centerStrength: v })}
          />
          <ForceSlider
            label="反発力"
            value={forceConfig.chargeStrength}
            min={-800}
            max={-50}
            step={10}
            onChange={(v) => setForceConfig({ chargeStrength: v })}
          />
          <ForceSlider
            label="リンク距離"
            value={forceConfig.linkDistance}
            min={50}
            max={400}
            step={10}
            onChange={(v) => setForceConfig({ linkDistance: v })}
          />
          <ForceSlider
            label="速度減衰"
            value={forceConfig.velocityDecay}
            min={0.2}
            max={0.8}
            step={0.05}
            onChange={(v) => setForceConfig({ velocityDecay: v })}
          />
        </div>
      )}
    </>
  );
}

function ForceSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280' }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', height: 4, cursor: 'pointer' }}
      />
    </div>
  );
}
