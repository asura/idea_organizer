import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { ResearchEdgeData } from '../../types/edge';
import { getEdgeStyle } from '../../utils/edgeStyles';
import { useUIStore } from '../../store/uiStore';

const EDGE_TYPE_LABELS: Record<string, string> = {
  RELATES_TO: '関連',
  SUPPORTS: '支持',
  CONTRADICTS: '矛盾',
  EXTENDS: '拡張',
  REQUIRES: '必要',
  INSPIRES: '着想',
  EVALUATES: '評価',
  COMPETES_WITH: '競合',
};

export function CustomEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const edgeData = data as unknown as ResearchEdgeData;
  const selectEdge = useUIStore((s) => s.selectEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const style = getEdgeStyle(edgeData?.confidence || 'medium', edgeData?.status || 'idea');
  const label = EDGE_TYPE_LABELS[edgeData?.edge_type || 'RELATES_TO'] || edgeData?.edge_type;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: selected ? '#2563EB' : style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
        interactionWidth={20}
      />
      <EdgeLabelRenderer>
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectEdge(id);
          }}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            background: selected ? '#EFF6FF' : 'white',
            padding: '1px 6px',
            borderRadius: 4,
            border: `1px solid ${selected ? '#2563EB' : style.stroke}`,
            color: selected ? '#2563EB' : style.stroke,
            pointerEvents: 'all',
            cursor: 'pointer',
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
