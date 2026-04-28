import { useMemo, useRef } from "react";

import {
  containsRenderWindow,
  expandRenderWindow,
  getLoopedSlideIndex,
  getRenderMovementSegment,
  getRenderWindow,
  getSlideA11yProps,
  getSlideVisibility,
  type CarouselLayout,
  type CarouselSlideRecord,
  type VirtualSlide,
} from "../../utilities";

interface UseCarouselSlidesProps {
  current: number;
  prev: number;
  isMoving: boolean;
  renderWindowBufferMultiplier: number;
  layout: CarouselLayout;
  slidesData: CarouselSlideRecord[];
}

interface UseCarouselSlidesResult {
  slides: VirtualSlide[];
  windowStart: number;
}

export function useCarouselSlides({
  current,
  prev,
  isMoving,
  renderWindowBufferMultiplier,
  layout,
  slidesData,
}: UseCarouselSlidesProps): UseCarouselSlidesResult {
  const renderWindowRef = useRef(
    getRenderWindow(prev, current, layout, renderWindowBufferMultiplier),
  );

  const renderWindow = useMemo(() => {
    const nextWindow = getRenderWindow(
      prev,
      current,
      layout,
      renderWindowBufferMultiplier,
    );

    if (!layout.canSlide || !isMoving) {
      renderWindowRef.current = nextWindow;
      return nextWindow;
    }

    const currentWindow = renderWindowRef.current;
    const movementSegment = getRenderMovementSegment(prev, current, layout);

    if (containsRenderWindow(currentWindow, movementSegment)) {
      return currentWindow;
    }

    const expandedWindow = expandRenderWindow(currentWindow, nextWindow);

    renderWindowRef.current = expandedWindow;
    return expandedWindow;
  }, [prev, current, layout, isMoving, renderWindowBufferMultiplier]);

  const virtualData = useMemo((): VirtualSlide[] => {
    const totalSlides = slidesData.length;
    if (totalSlides === 0) return [];

    const length = Math.max(0, renderWindow.end - renderWindow.start + 1);

    return Array.from({ length }).map((_, offset) => {
      const virtualIndex = renderWindow.start + offset;
      const slideRecord =
        slidesData[getLoopedSlideIndex(virtualIndex, totalSlides)]!;
      const usesCloneKey =
        layout.canSlide &&
        !layout.isFinite &&
        (virtualIndex < 0 || virtualIndex >= totalSlides);

      const { isActual, isActive } = getSlideVisibility(
        virtualIndex,
        current,
        prev,
        layout.clampedVisible,
        isMoving,
      );

      const a11yProps = getSlideA11yProps(
        { slideIndex: slideRecord.layoutIndex },
        isActual,
        totalSlides,
      );

      return {
        slideData: slideRecord.slideData,
        isActive,
        isActual,
        slideKey: usesCloneKey
          ? `clone:${slideRecord.slideKey}:${virtualIndex}`
          : slideRecord.slideKey,
        a11yProps,
      };
    });
  }, [layout, current, prev, isMoving, slidesData, renderWindow]);

  return {
    slides: virtualData,
    windowStart: renderWindow.start,
  };
}
