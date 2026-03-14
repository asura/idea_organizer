import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { ResearchEdgeData } from '../../types/edge';
import { getEdgeStyle } from '../../utils/edgeStyles';

const EDGE_TYPE_LABELS: Record<string, string> = {
  RELATES_TO: '\u95A2\u9023',
  SUPPORTS: '\u652F\u6301',
  CONTRADICTS: '\u77DB\u76FE',
  EXTENDS: '\u62E1\u5F35',
  REQUIRES: '\u5FC5\u8981',
  INSPIRES: '\u7740\u60F3',
  EVALUATES: '\u8A55\u4FA1',
  COMPETES_WITH: '\u7AF6\u5408',
};

export function CustomEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const edgeData = data as unknown as ResearchEdgeData;

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
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            background: 'white',
            padding: '1px 6px',
            borderRadius: 4,
            border: `1px solid ${style.stroke}`,
            color: style.stroke,
            pointerEvents: 'all',
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
