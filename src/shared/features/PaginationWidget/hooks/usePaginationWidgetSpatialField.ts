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
import {
  normalizePaginationWidgetSpatialConfig,
  normalizePaginationWidgetVisibleDots,
} from "../model/paginationWidgetConfig";

export function usePaginationWidgetSpatialField({
  visibleDots,
  config,
  step,
}: {
  visibleDots: number;
  config: PaginationWidgetSpatialConfig;
  step: number;
}) {
  const { size, gap, scaleFactor } = config;
  const safeConfig = useMemo(
    () => normalizePaginationWidgetSpatialConfig({ size, gap, scaleFactor }),
    [gap, scaleFactor, size],
  );

  const safeVisibleDots = useMemo(
    () => normalizePaginationWidgetVisibleDots(visibleDots),
    [visibleDots],
  );

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
