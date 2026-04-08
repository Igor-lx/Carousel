import { useMemo } from "react";

import {
  getSafeIndexMap,
  getSlideA11y,
  getSlideMetadata,
  getSlideVisibility,
  type CarouselLayout,
  type VirtualSlide,
} from "../utilites";
import type { Slide } from "../Carousel.types";

interface SlidesProps {
  current: number;
  prev: number | null;
  isMoving: boolean;
  layout: CarouselLayout;
  data: Slide[];
  count: number;
}

interface SlidesResult {
  data: VirtualSlide[];
  activeDot: number;
  isAtStart: boolean;
  isAtEnd: boolean;
}

export function useCarouselSlides({
  current,
  prev,
  isMoving,
  layout,
  data,
  count,
}: SlidesProps): SlidesResult {
  const normalized = useMemo(() => {
    if (!layout.canSlide) return 0;

    const { normalizedIndex } = getSafeIndexMap(
      current,
      layout.cloneCount,
      layout.virtualLength,
    );

    return normalizedIndex;
  }, [current, layout.cloneCount, layout.virtualLength, layout.canSlide]);

  const { isAtStart, isAtEnd } = useMemo(() => {
    if (layout.isInfinite) {
      return { isAtStart: false, isAtEnd: false };
    }
    return {
      isAtStart: current <= layout.minScrollIndex,
      isAtEnd: current >= layout.maxScrollIndex,
    };
  }, [
    layout.isInfinite,
    layout.minScrollIndex,
    layout.maxScrollIndex,
    current,
  ]);

  const virtualData = useMemo((): VirtualSlide[] => {
    return Array.from({ length: layout.totalVirtual }).map((_, vIndex) => {
      const metadata = getSlideMetadata(vIndex, layout);
      const { originalIndex, isClone } = metadata;

      const { isActual, isActive } = getSlideVisibility(
        vIndex,
        current,
        prev,
        layout.clampedVisible,
        isMoving,
      );

      const a11yProps = getSlideA11y(metadata, isActual, count);

      return {
        vIndex,
        originalIndex,
        isClone,
        isActive,
        isActual,
        slideKey: `${isClone ? "clone" : "orig"}-${vIndex}-${data[originalIndex]?.id ?? originalIndex}`,
        a11yProps,
      };
    });
  }, [layout, current, prev, isMoving, data, count]);

  const activeDot = Math.floor(normalized / layout.clampedVisible);

  return {
    data: virtualData,
    activeDot,
    isAtStart,
    isAtEnd,
  };
}
