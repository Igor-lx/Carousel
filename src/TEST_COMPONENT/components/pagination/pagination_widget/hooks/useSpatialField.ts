import { useMemo } from "react";
import type { SpatialConfig, DotWidgetState, LayoutModel } from "../types";
import {
  precomputeScales,
  computeStrip,
  computePool,
  projectDot,
} from "../utils/math";

export function useSpatialField({
  visibleDots,
  config,
  step,
}: {
  visibleDots: number;
  config: SpatialConfig;
  step: number;
}) {
  const safeConfig = useMemo(
    () => ({
      size: Math.max(config.size, 1),
      gap: Math.max(config.gap, 0),
      scaleFactor: Math.max(config.scaleFactor, 0.01),
    }),
    [config.size, config.gap, config.scaleFactor],
  );

  const layoutModel = useMemo((): LayoutModel => {
    const count = Math.max(Number(visibleDots) || 3, 3);
    const actualCount = count % 2 === 0 ? count + 1 : count;
    const centerIndex = Math.floor(actualCount / 2);

    const scales = precomputeScales(
      actualCount,
      centerIndex,
      safeConfig.scaleFactor,
    );

    return {
      scales,
      geometry: {
        strip: computeStrip(scales, safeConfig),
        actualCount,
        centerIndex,
        unit: safeConfig.size + safeConfig.gap,
      },
    };
  }, [visibleDots, safeConfig]);

  const baseStep = Math.round(step);
  const pool = useMemo(() => {
    return computePool(baseStep, layoutModel.geometry.actualCount);
  }, [baseStep, layoutModel.geometry.actualCount]);

  const dotsData = useMemo((): DotWidgetState[] => {
    return pool.map((id) => projectDot(id, step, layoutModel));
  }, [pool, step, layoutModel]);

  return {
    dotsData,
    actualVisibleDots: layoutModel.geometry.actualCount,
  };
}
