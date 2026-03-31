import { useMemo, useCallback } from "react";
import type { DotWidgetState, SpatialConfig } from "../types";
import { DOTS_POOL_BUFFER, EDGE_DOT_DRIFT_FACTOR } from "../const";

export function useSpatialField({
  visibleDots,
  config,
  step,
}: {
  visibleDots: number;
  config: SpatialConfig;
  step: number;
}) {
  const { actualCount, centerIndex } = useMemo(() => {
    const count = Math.max(Number(visibleDots) || 3, 3);
    const actual = count % 2 === 0 ? count + 1 : count;
    return { actualCount: actual, centerIndex: Math.floor(actual / 2) };
  }, [visibleDots]);

  const unit = useMemo(
    () => config.size + config.gap,
    [config.size, config.gap],
  );

  const getScale = useCallback(
    (dist: number) => {
      const abs = Math.abs(dist);
      return abs > centerIndex + 0.5 ? 0 : Math.pow(config.scaleFactor, abs);
    },
    [centerIndex, config.scaleFactor],
  );

  const strip = useMemo(() => {
    const res = new Array(actualCount).fill(0);
    if (config.size <= 0) return res;

    for (let i = centerIndex + 1; i < actualCount; i++) {
      const d =
        config.gap +
        (config.size *
          (getScale(i - 1 - centerIndex) + getScale(i - centerIndex))) /
          2;
      res[i] = res[i - 1] + d;
    }
    for (let i = centerIndex - 1; i >= 0; i--) {
      const d =
        config.gap +
        (config.size *
          (getScale(i + 1 - centerIndex) + getScale(i - centerIndex))) /
          2;
      res[i] = res[i + 1] - d;
    }
    return res;
  }, [actualCount, centerIndex, config.gap, config.size, getScale]);

  const getDotState = useCallback(
    (id: number): DotWidgetState => {
      const dist = id - step;
      const absDist = Math.abs(dist);
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

      return {
        x,
        scale: getScale(dist),
        opacity:
          absDist > centerIndex - 0.5
            ? Math.max(0, 1 - (absDist - (centerIndex - 0.5)))
            : 1,
        isActive: id === Math.round(step),
      };
    },
    [step, centerIndex, strip, unit, getScale, actualCount],
  );

  const baseStep = Math.round(step);
  const dotsPool = useMemo(() => {
    const side = Math.max(actualCount, DOTS_POOL_BUFFER);
    return Array.from({ length: side * 2 + 1 }, (_, i) => baseStep - side + i);
  }, [baseStep, actualCount]);

  return { getDotState, dotsPool, actualVisibleDots: actualCount };
}
