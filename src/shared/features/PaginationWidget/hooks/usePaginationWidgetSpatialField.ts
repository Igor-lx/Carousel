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

  const safeVisibleDots = useMemo(() => {
    const fallback = 3;
    const finiteVisibleDots =
      typeof visibleDots === "number" && Number.isFinite(visibleDots)
        ? visibleDots
        : fallback;
    const integerVisibleDots = Math.max(Math.floor(finiteVisibleDots), fallback);

    return integerVisibleDots % 2 === 0
      ? integerVisibleDots + 1
      : integerVisibleDots;
  }, [visibleDots]);

  const layoutModel = useMemo((): PaginationWidgetLayoutModel => {
    const actualCount = safeVisibleDots;
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
  }, [safeConfig, safeVisibleDots]);

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
