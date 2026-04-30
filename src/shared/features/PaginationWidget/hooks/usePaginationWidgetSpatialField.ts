import { useMemo } from "react";
import type {
  PaginationWidgetDotState,
  PaginationWidgetLayoutModel,
  PaginationWidgetSpatialConfig,
} from "../model/paginationWidgetTypes";
import {
  normalizePaginationWidgetSpatialConfig,
  normalizePaginationWidgetVisibleDots,
} from "../model/paginationWidgetConfig";
import {
  computePool,
  computeStrip,
  precomputeScales,
  projectDot,
} from "../utils/paginationWidgetMath";

export function usePaginationWidgetSpatialField({
  visibleDots,
  config,
  visualOffset,
}: {
  visibleDots: number;
  config: PaginationWidgetSpatialConfig;
  visualOffset: number;
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

  const baseVisualOffset = Math.round(visualOffset);
  const pool = useMemo(() => {
    return computePool(baseVisualOffset, layoutModel.geometry.actualCount);
  }, [baseVisualOffset, layoutModel.geometry.actualCount]);

  const dotsData = useMemo((): PaginationWidgetDotState[] => {
    return pool.map((id) => projectDot(id, visualOffset, layoutModel));
  }, [pool, visualOffset, layoutModel]);

  return {
    dotsData,
    actualVisibleDots: layoutModel.geometry.actualCount,
  };
}
