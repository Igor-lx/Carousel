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
  const dotsCount = Math.max(Number(visibleDots) || 3, 3);

  const { actualCount, centerIndex } = useMemo(() => {
    const actual = dotsCount % 2 === 0 ? dotsCount + 1 : dotsCount;
    return { actualCount: actual, centerIndex: Math.floor(actual / 2) };
  }, [dotsCount]);
  const getScale = useCallback(
    (dist: number) => {
      const abs = Math.abs(dist);
      if (abs > centerIndex + 0.5) return 0;
      return Math.pow(config.scaleFactor, abs);
    },
    [centerIndex, config.scaleFactor],
  );

  const strip = useMemo(() => {
    const res = new Array(actualCount).fill(0);
    if (config.size === 0) return res;

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
  }, [actualCount, centerIndex, config, getScale]);

  const getDotState = useCallback(
    (id: number): DotWidgetState => {
      const dist = id - step;
      const absDist = Math.abs(dist);
      const slot = dist + centerIndex;
      const unit = config.size + config.gap;

      let x: number;
      if (slot < 0) {
        x = strip[0] - (1 - Math.exp(slot)) * (unit * EDGE_DOT_DRIFT_FACTOR);
      } else if (slot > actualCount - 1) {
        const overSlot = slot - (actualCount - 1);
        x =
          strip[actualCount - 1] +
          (1 - Math.exp(-overSlot)) * (unit * EDGE_DOT_DRIFT_FACTOR);
      } else {
        const f = Math.floor(slot),
          c = Math.ceil(slot),
          t = slot - f;
        const xF = strip[f],
          xC = strip[c] ?? xF + unit;
        x = xF + (xC - xF) * t;
      }

      const fadeStart = centerIndex - 0.5;
      const opacity =
        absDist > fadeStart ? Math.max(0, 1 - (absDist - fadeStart)) : 1;

      return {
        id,
        x,
        scale: getScale(dist),
        opacity,
        isActive: Math.abs(dist) < 0.1,
      };
    },
    [step, centerIndex, strip, config, getScale, actualCount],
  );

  const dotsPool = useMemo(() => {
    const side = Math.max(actualCount, DOTS_POOL_BUFFER);
    const range = [];
    const base = Math.round(step);
    for (let i = base - side; i <= base + side; i++) {
      range.push(i);
    }
    return range;
  }, [step, actualCount]);

  return { getDotState, dotsPool, actualVisibleDots: actualCount };
}
