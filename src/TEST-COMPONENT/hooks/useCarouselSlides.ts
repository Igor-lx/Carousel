import { useMemo, useRef } from "react";

import {
  getLoopedSlideIndex,
  getRenderWindow,
  getSlideA11y,
  getSlideVisibility,
  type CarouselLayout,
  type ResolvedCarouselSlide,
  type VirtualSlide,
} from "../utilities";

interface SlidesProps {
  current: number;
  prev: number;
  isMoving: boolean;
  targetIndex: number;
  layout: CarouselLayout;
  slidesData: ResolvedCarouselSlide[];
}

interface SlidesResult {
  slides: VirtualSlide[];
  isAtStart: boolean;
  isAtEnd: boolean;
  windowStart: number;
}

export function useCarouselSlides({
  current,
  prev,
  isMoving,
  targetIndex,
  layout,
  slidesData,
}: SlidesProps): SlidesResult {
  const renderWindowRef = useRef(getRenderWindow(prev, current, layout));

  const renderWindow = useMemo(() => {
    const nextWindow = getRenderWindow(prev, current, layout);

    if (!layout.canSlide || !isMoving) {
      renderWindowRef.current = nextWindow;
      return nextWindow;
    }

    const currentWindow = renderWindowRef.current;
    const segmentStart = Math.floor(Math.min(prev, current));
    const segmentEnd =
      Math.ceil(Math.max(prev, current)) + layout.clampedVisible - 1;
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
  }, [prev, current, layout, isMoving]);

  const { isAtStart, isAtEnd } = useMemo(() => {
    if (!layout.isFinite) {
      return { isAtStart: false, isAtEnd: false };
    }
    return {
      isAtStart: targetIndex <= 0,
      isAtEnd: targetIndex >= layout.pageCount - 1,
    };
  }, [layout.isFinite, layout.pageCount, targetIndex]);

  const virtualData = useMemo((): VirtualSlide[] => {
    const totalSlides = slidesData.length;
    if (totalSlides === 0) return [];

    const length = Math.max(0, renderWindow.end - renderWindow.start + 1);

    return Array.from({ length }).map((_, offset) => {
      const vIndex = renderWindow.start + offset;
      const slideIndex = getLoopedSlideIndex(vIndex, totalSlides);
      const resolvedSlide = slidesData[slideIndex]!;
      const isClone =
        layout.canSlide &&
        !layout.isFinite &&
        (vIndex < 0 || vIndex >= totalSlides);

      const { isActual, isActive } = getSlideVisibility(
        vIndex,
        current,
        prev,
        layout.clampedVisible,
        isMoving,
      );

      const a11yProps = getSlideA11y(
        { slideIndex: resolvedSlide.positionIndex },
        isActual,
        totalSlides,
      );

      return {
        vIndex,
        slideIndex: resolvedSlide.positionIndex,
        sourceIndex: resolvedSlide.sourceIndex,
        slideData: resolvedSlide.slideData,
        isClone,
        isActive,
        isActual,
        slideKey: isClone
          ? `clone:${resolvedSlide.slideKey}:${vIndex}`
          : resolvedSlide.slideKey,
        a11yProps,
      };
    });
  }, [layout, current, prev, isMoving, slidesData, renderWindow]);

  return {
    slides: virtualData,
    isAtStart,
    isAtEnd,
    windowStart: renderWindow.start,
  };
}
