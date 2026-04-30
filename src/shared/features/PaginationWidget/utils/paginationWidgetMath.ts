import { EDGE_DOT_DRIFT_FACTOR } from "../model/paginationWidgetConstants";
import type {
  PaginationWidgetDotState,
  PaginationWidgetLayoutModel,
  PaginationWidgetSpatialConfig,
} from "../model/paginationWidgetTypes";

export const precomputeScales = (
  actualCount: number,
  centerIndex: number,
  scaleFactor: number,
): number[] => {
  return Array.from({ length: actualCount }, (_, i) => {
    const dist = Math.abs(i - centerIndex);
    return dist > centerIndex + 0.5 ? 0 : Math.pow(scaleFactor, dist);
  });
};

export const computeStrip = (
  scales: number[],
  config: PaginationWidgetSpatialConfig,
): number[] => {
  const count = scales.length;
  const centerIndex = Math.floor(count / 2);
  const res = new Array(count).fill(0);

  for (let i = centerIndex + 1; i < count; i++) {
    res[i] =
      res[i - 1] + config.gap + (config.size * (scales[i - 1] + scales[i])) / 2;
  }
  for (let i = centerIndex - 1; i >= 0; i--) {
    res[i] =
      res[i + 1] - config.gap - (config.size * (scales[i + 1] + scales[i])) / 2;
  }
  return res;
};

export const computePool = (
  baseStep: number,
  actualCount: number,
): number[] => {
  const side = Math.max(actualCount, 1);
  return Array.from({ length: side * 2 + 1 }, (_, i) => baseStep - side + i);
};

export const projectDot = (
  id: number,
  visualOffset: number,
  model: PaginationWidgetLayoutModel,
): PaginationWidgetDotState => {
  const dist = id - visualOffset;
  const { geometry, scales } = model;
  const { centerIndex, strip, actualCount, unit } = geometry;
  const slot = dist + centerIndex;

  let x: number;
  if (slot < 0) {
    x = strip[0] - (1 - Math.exp(slot)) * (unit * EDGE_DOT_DRIFT_FACTOR);
  } else if (slot > actualCount - 1) {
    x =
      strip[actualCount - 1] +
      (1 - Math.exp(-(slot - (actualCount - 1)))) *
        (unit * EDGE_DOT_DRIFT_FACTOR);
  } else {
    const f = Math.floor(slot),
      c = Math.ceil(slot),
      t = slot - f;
    const xF = strip[f],
      xC = strip[c] ?? xF + unit;
    x = xF + (xC - xF) * t;
  }

  const f = Math.floor(slot),
    c = Math.ceil(slot),
    t = slot - f;
  const sF = scales[f] ?? 0,
    sC = scales[c] ?? 0;
  const scale = slot < 0 || slot > actualCount - 1 ? 0 : sF + (sC - sF) * t;

  const absDist = Math.abs(dist);
  return {
    id,
    x,
    scale,
    opacity:
      absDist > centerIndex - 0.5
        ? Math.max(0, 1 - (absDist - (centerIndex - 0.5)))
        : 1,
    isActive: id === Math.round(visualOffset),
  };
};
