import type { Slide } from "../types";
import type {
  CarouselLayout,
  RenderWindow,
  CarouselSlideRecord,
} from "./types";
import { clamp, mod, normalizePageIndex } from "./math";
import { getClampedVisibleSlidesCount } from "./visible-slides";

export const getPageStart = (pageIndex: number, visibleSlidesNr: number) =>
  pageIndex * visibleSlidesNr;

const getSlideContentKey = (slideData: Slide) =>
  `${slideData.id}-${typeof slideData.content === "string" ? slideData.content : "obj"}`;

export const getCarouselLayout = (
  slideRecords: CarouselSlideRecord[],
  visibleSlidesNr: number,
  isFinite: boolean,
): CarouselLayout => {
  const length = slideRecords.length;
  const clampedVisible = getClampedVisibleSlidesCount(
    length,
    visibleSlidesNr,
  );
  const canSlide = length > clampedVisible;
  const pageCount = Math.ceil(length / clampedVisible);
  const cloneCount = canSlide && !isFinite ? clampedVisible : 0;
  const virtualLength = canSlide && !isFinite ? pageCount * clampedVisible : length;
  const totalVirtual = canSlide && !isFinite
    ? virtualLength + cloneCount * 2
    : length;
  const dataKey = slideRecords
    .map(({ slideData, slideKey }) =>
      `${slideKey}-${getSlideContentKey(slideData)}`,
    )
    .join("|");

  return {
    length,
    clampedVisible,
    virtualLength,
    totalVirtual,
    pageCount,
    canSlide,
    dataKey,
    isFinite,
  };
};

export const getAlignedVirtualIndex = (
  pageIndex: number,
  referenceVirtualIndex: number,
  layout: CarouselLayout,
) => {
  const normalizedPageIndex = normalizePageIndex(pageIndex, layout.pageCount);
  const pageStart = getPageStart(normalizedPageIndex, layout.clampedVisible);

  if (layout.isFinite || layout.virtualLength <= 0) {
    return pageStart;
  }

  const laneOffset = Math.round(
    (referenceVirtualIndex - pageStart) / layout.virtualLength,
  );

  return pageStart + laneOffset * layout.virtualLength;
};

export const getNearestPageIndex = (
  virtualIndex: number,
  layout: CarouselLayout,
) => {
  if (layout.pageCount <= 0 || layout.clampedVisible <= 0) {
    return 0;
  }

  const rawPageIndex = Math.round(virtualIndex / layout.clampedVisible);

  return layout.isFinite
    ? clamp(rawPageIndex, 0, layout.pageCount - 1)
    : normalizePageIndex(rawPageIndex, layout.pageCount);
};

export const getRenderWindow = (
  fromVirtualIndex: number,
  toVirtualIndex: number,
  layout: CarouselLayout,
  renderWindowBufferMultiplier: number,
): RenderWindow => {
  if (!layout.canSlide) {
    return {
      start: 0,
      end: Math.max(0, layout.length - 1),
    };
  }

  const segmentStart = Math.floor(Math.min(fromVirtualIndex, toVirtualIndex));
  const segmentEnd =
    Math.ceil(Math.max(fromVirtualIndex, toVirtualIndex)) +
    layout.clampedVisible -
    1;
  const buffer = layout.clampedVisible * renderWindowBufferMultiplier;

  if (layout.isFinite) {
    return {
      start: clamp(segmentStart - buffer, 0, Math.max(0, layout.length - 1)),
      end: clamp(segmentEnd + buffer, 0, Math.max(0, layout.length - 1)),
    };
  }

  return {
    start: segmentStart - buffer,
    end: segmentEnd + buffer,
  };
};

export const getRenderMovementSegment = (
  fromVirtualIndex: number,
  toVirtualIndex: number,
  layout: CarouselLayout,
): RenderWindow => ({
  start: Math.floor(Math.min(fromVirtualIndex, toVirtualIndex)),
  end:
    Math.ceil(Math.max(fromVirtualIndex, toVirtualIndex)) +
    layout.clampedVisible -
    1,
});

export const containsRenderWindow = (
  renderWindow: RenderWindow,
  containedWindow: RenderWindow,
) =>
  renderWindow.start <= containedWindow.start &&
  renderWindow.end >= containedWindow.end;

export const expandRenderWindow = (
  currentWindow: RenderWindow,
  nextWindow: RenderWindow,
): RenderWindow => ({
  start: Math.min(currentWindow.start, nextWindow.start),
  end: Math.max(currentWindow.end, nextWindow.end),
});

export const getCarouselBoundaryState = (
  targetIndex: number,
  layout: CarouselLayout,
) => {
  if (!layout.isFinite) {
    return { isAtStart: false, isAtEnd: false };
  }

  return {
    isAtStart: targetIndex <= 0,
    isAtEnd: targetIndex >= layout.pageCount - 1,
  };
};

export const getReconciledPageIndex = (
  currentIndex: number,
  prevLayout: CarouselLayout,
  nextLayout: CarouselLayout,
) => {
  if (prevLayout.pageCount <= 1 || nextLayout.pageCount <= 1) return 0;

  const oldMaxIndex = Math.max(1, prevLayout.pageCount - 1);
  const progress = clamp(currentIndex, 0, oldMaxIndex) / oldMaxIndex;
  const nextMaxIndex = Math.max(1, nextLayout.pageCount - 1);

  return clamp(
    Math.round(progress * nextMaxIndex),
    0,
    nextLayout.pageCount - 1,
  );
};

export const getLoopedSlideIndex = (
  virtualIndex: number,
  totalSlides: number,
) => mod(virtualIndex, totalSlides);
