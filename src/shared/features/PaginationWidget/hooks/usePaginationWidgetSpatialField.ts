import { useMemo } from "react";
import type {
  PaginationWidgetDotState,
  PaginationWidgetLayoutModel,
  PaginationWidgetSpatialConfig,
} from "../model/paginationWidgetTypes";
import {
  computePool,
  computeStrip,
  precomputeScales,
  projectDot,
} from "../utils/paginationWidgetMath";

export function usePaginationWidgetSpatialField({
  visibleDots,
  config,
  step,
}: {
  visibleDots: number;
  config: PaginationWidgetSpatialConfig;
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

  const layoutModel = useMemo((): PaginationWidgetLayoutModel => {
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

  const dotsData = useMemo((): PaginationWidgetDotState[] => {
    return pool.map((id) => projectDot(id, step, layoutModel));
  }, [pool, step, layoutModel]);

  return {
    dotsData,
    actualVisibleDots: layoutModel.geometry.actualCount,
  };
}
