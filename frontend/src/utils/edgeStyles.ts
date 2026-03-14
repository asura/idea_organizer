import type { Confidence, EdgeStatus } from '../types/edge';
import { STATUS_COLORS } from './colors';

export function getEdgeStyle(confidence: Confidence, status: EdgeStatus) {
  const strokeDasharray =
    confidence === 'high' ? undefined :
    confidence === 'medium' ? '8 4' :
    '4 4';

  const stroke = STATUS_COLORS[status];
  const strokeWidth = confidence === 'high' ? 2.5 : 2;
  const animated = status === 'idea';

  return { strokeDasharray, stroke, strokeWidth, animated };
}
