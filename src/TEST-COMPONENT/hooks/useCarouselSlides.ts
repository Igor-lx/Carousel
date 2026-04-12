import { useMemo, useRef } from "react";

import {
  getRenderWindow,
  getSlideA11y,
  getSlideMetadata,
  getSlideVisibility,
  type CarouselLayout,
  type VirtualSlide,
} from "../utilites";
import type { Slide } from "../Carousel.types";

interface SlidesProps {
  current: number;
  prev: number;
  renderTarget: number;
  isMoving: boolean;
  targetIndex: number;
  layout: CarouselLayout;
  data: Slide[];
  count: number;
}

interface SlidesResult {
  data: VirtualSlide[];
  activeDot: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  windowStart: number;
}

export function useCarouselSlides({
  current,
  prev,
  renderTarget,
  isMoving,
  targetIndex,
  layout,
  data,
  count,
}: SlidesProps): SlidesResult {
  const renderWindowRef = useRef(getRenderWindow(prev, renderTarget, layout));

  const renderWindow = useMemo(() => {
    const nextWindow = getRenderWindow(prev, renderTarget, layout);

    if (!layout.canSlide || !isMoving) {
      renderWindowRef.current = nextWindow;
      return nextWindow;
    }

    const currentWindow = renderWindowRef.current;
    const segmentStart = Math.floor(Math.min(prev, renderTarget));
    const segmentEnd =
      Math.ceil(Math.max(prev, renderTarget)) + layout.clampedVisible - 1;
    const containsSegment =
      currentWindow.start <= segmentStart && currentWindow.end >= segmentEnd;

    if (containsSegment) {
      return currentWindow;
    }

    const expandedWindow = {
      start: Math.min(currentWindow.start, nextWindow.start),
      end: Math.max(currentWindow.end, nextWindow.end),
    };

    renderWindowRef.current = expandedWindow;
    return expandedWindow;
  }, [prev, renderTarget, layout, isMoving]);

  const { isAtStart, isAtEnd } = useMemo(() => {
    if (layout.isInfinite) {
      return { isAtStart: false, isAtEnd: false };
    }
    return {
      isAtStart: targetIndex <= 0,
      isAtEnd: targetIndex >= layout.pageCount - 1,
    };
  }, [
    layout.isInfinite,
    layout.pageCount,
    targetIndex,
  ]);

  const virtualData = useMemo((): VirtualSlide[] => {
    const length = Math.max(0, renderWindow.end - renderWindow.start + 1);

    return Array.from({ length }).map((_, offset) => {
      const vIndex = renderWindow.start + offset;
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
  }, [layout, current, prev, isMoving, data, count, renderWindow]);

  return {
    data: virtualData,
    activeDot: targetIndex,
    isAtStart,
    isAtEnd,
    windowStart: renderWindow.start,
  };
}
