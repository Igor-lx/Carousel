import type { Slide } from "../Carousel.types";
import type { StepAction } from "../model/reducer";
import type { CarouselLayout, RenderWindow, SlideA11yProps } from "./types";


export const getCarouselLayout = (
  slides: Slide[],
  visibleSlides: number,
  isInfinite: boolean,
): CarouselLayout => {
  const length = slides.length;
  const clampedVisible = Math.max(1, Math.min(visibleSlides, length));
  const canSlide = length > clampedVisible;

  const pageCount = Math.ceil(length / clampedVisible);

  const cloneCount = canSlide && isInfinite ? clampedVisible : 0;

  const virtualLength =
    canSlide && isInfinite ? pageCount * clampedVisible : length;

  const totalVirtual =
    canSlide && isInfinite ? virtualLength + cloneCount * 2 : length;

  const dataKey = slides
    .map((s) => `${s.id}-${typeof s.content === "string" ? s.content : "obj"}`)
    .join("|");

  const minScrollIndex = 0;

  const maxScrollIndex = isInfinite
    ? totalVirtual - clampedVisible
    : Math.max(0, (pageCount - 1) * clampedVisible);

  return {
    length,
    clampedVisible,
    canSlide,
    pageCount,
    virtualLength,
    cloneCount,
    totalVirtual,
    dataKey,
    isInfinite,
    minScrollIndex,
    maxScrollIndex,
  };
};

export const getSafeIndexMap = (
  currentIndex: number,
  cloneCount: number,
  virtualLength: number,
) => {
  if (virtualLength <= 0) {
    return {
      normalizedIndex: 0,
      targetIndex: cloneCount,
      shouldJump: false,
    };
  }

  const normalizedIndex =
    (((currentIndex - cloneCount) % virtualLength) + virtualLength) %
    virtualLength;

  const targetIndex = normalizedIndex + cloneCount;

  const shouldJump = currentIndex !== targetIndex;

  return {
    normalizedIndex,
    targetIndex,
    shouldJump,
  };
};

export const mod = (value: number, total: number) => {
  if (total <= 0) return 0;
  return ((value % total) + total) % total;
};

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

export const getPageStart = (pageIndex: number, visible: number) =>
  pageIndex * visible;

export const getAlignedVirtualIndex = (
  pageIndex: number,
  referenceVirtualIndex: number,
  layout: CarouselLayout,
) => {
  const normalizedPageIndex = normalizePageIndex(pageIndex, layout.pageCount);
  const pageStart = getPageStart(normalizedPageIndex, layout.clampedVisible);

  if (!layout.isInfinite || layout.virtualLength <= 0) {
    return pageStart;
  }

  const laneOffset = Math.round(
    (referenceVirtualIndex - pageStart) / layout.virtualLength,
  );

  return pageStart + laneOffset * layout.virtualLength;
};

export const normalizePageIndex = (pageIndex: number, pageCount: number) => {
  if (pageCount <= 0) return 0;
  return mod(pageIndex, pageCount);
};

export const getShortestDistance = (
  from: number,
  to: number,
  total: number,
) => {
  if (total <= 0) return 0;

  const forward = mod(to - from, total);
  const backward = forward - total;

  return Math.abs(forward) <= Math.abs(backward) ? forward : backward;
};

export const getPageIndexFromVirtualIndex = (
  virtualIndex: number,
  visible: number,
  pageCount: number,
) => {
  if (pageCount <= 0 || visible <= 0) return 0;
  return normalizePageIndex(Math.round(virtualIndex / visible), pageCount);
};

export const getRenderWindow = (
  fromVirtualIndex: number,
  toVirtualIndex: number,
  layout: CarouselLayout,
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
    layout.clampedVisible - 1;
  const buffer = layout.clampedVisible * 2;

  if (!layout.isInfinite) {
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

export const getSlideMetadata = (
  vIndex: number,
  { length, canSlide, isInfinite }: CarouselLayout,
) => {
  if (!canSlide) return { originalIndex: vIndex, isClone: false };

  const isClone = isInfinite && (vIndex < 0 || vIndex >= length);
  const originalIndex = mod(vIndex, length);

  return { originalIndex, isClone };
};

export const getSlideVisibility = (
  vIndex: number,
  currentIndex: number,
  prevIndex: number,
  clampedVisible: number,
  isAnimating: boolean,
) => {
  const isActual =
    vIndex >= currentIndex && vIndex < currentIndex + clampedVisible;

  if (isAnimating) {
    const startIdx = Math.floor(prevIndex);
    const wasVisible =
      vIndex >= startIdx && vIndex < Math.ceil(prevIndex + clampedVisible);
    return { isActual, isActive: isActual || wasVisible };
  }
  return { isActual, isActive: isActual };
};

export const getCarouselTransform = (
  index: number,
  visible: number,
): string => {
  return `translateX(calc(-${index} * (100% + var(--gap, 0px)) / ${visible}))`;
};

export const getSlideFlexStyle = (visible: number): { flex: string } => {
  return {
    flex: `0 0 calc((100% - (var(--gap, 0px) * ${visible - 1})) / ${visible})`,
  };
};

export const getSlideA11y = (
  metadata: { originalIndex: number },
  isActual: boolean,
  total: number,
): SlideA11yProps => {
  return {
    role: "group",
    "aria-roledescription": "slide",
    "aria-label": `${metadata.originalIndex + 1} of ${total}`,
    ...(isActual && { "aria-current": "step" as const }),
  };
};

export const getNextIndex = (
  action: StepAction,
  currentIndex: number,
  currentLayout: CarouselLayout,
): number => {
  const rawIndex =
    action.type === "MOVE"
      ? currentIndex + action.step * currentLayout.clampedVisible
      : action.target;

  if (currentLayout.isInfinite && action.isInstant) {
    return getSafeIndexMap(
      rawIndex,
      currentLayout.cloneCount,
      currentLayout.virtualLength,
    ).targetIndex;
  }
  const clampedIndex = clamp(
    rawIndex,
    currentLayout.minScrollIndex,
    currentLayout.maxScrollIndex,
  );

  return clampedIndex;
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

  return clamp(Math.round(progress * nextMaxIndex), 0, nextLayout.pageCount - 1);
};

export const getReconciledIndex = (
  currentIndex: number,
  prevLayout: CarouselLayout,
  nextLayout: CarouselLayout,
): number => {
  if (!prevLayout.virtualLength || !nextLayout.virtualLength) {
    return nextLayout.cloneCount;
  }
  const { normalizedIndex } = getSafeIndexMap(
    currentIndex,
    prevLayout.cloneCount,
    prevLayout.virtualLength,
  );

  const oldMaxScroll = Math.max(
    0,
    prevLayout.virtualLength - prevLayout.clampedVisible,
  );
  const scrollProgress = oldMaxScroll <= 0 ? 0 : normalizedIndex / oldMaxScroll;

  const nextMaxScroll = Math.max(
    0,
    nextLayout.virtualLength - nextLayout.clampedVisible,
  );
  const rawTarget = scrollProgress * nextMaxScroll;

  const page = Math.round(rawTarget / nextLayout.clampedVisible);
  const targetIndex = nextLayout.cloneCount + page * nextLayout.clampedVisible;

  const clampedIndex = clamp(
    targetIndex,
    nextLayout.minScrollIndex,
    nextLayout.maxScrollIndex,
  );

  return clampedIndex;
};

const parseLengthValue = (rawValue: string) => {
  const value = Number.parseFloat(rawValue);
  return Number.isFinite(value) ? value : 0;
};

export const getTrackSlotSize = (
  viewport: HTMLElement,
  visibleSlides: number,
) => {
  if (visibleSlides <= 0) return 0;

  const viewportWidth = viewport.offsetWidth;
  const styles = window.getComputedStyle(viewport);
  const gapValue =
    styles.getPropertyValue("--gap") ||
    styles.getPropertyValue("gap") ||
    styles.getPropertyValue("column-gap");

  const gap = parseLengthValue(gapValue);

  return (viewportWidth + gap) / visibleSlides;
};

export const getTranslateX = (track: HTMLElement) => {
  const transform = window.getComputedStyle(track).transform;

  if (!transform || transform === "none") return 0;

  if (transform.startsWith("matrix3d(")) {
    const values = transform
      .slice("matrix3d(".length, -1)
      .split(",")
      .map((part) => Number.parseFloat(part.trim()));

    return Number.isFinite(values[12]) ? values[12] : 0;
  }

  if (transform.startsWith("matrix(")) {
    const values = transform
      .slice("matrix(".length, -1)
      .split(",")
      .map((part) => Number.parseFloat(part.trim()));

    return Number.isFinite(values[4]) ? values[4] : 0;
  }

  return 0;
};

export const getCurrentVirtualIndexFromDOM = ({
  track,
  viewport,
  visibleSlides,
  windowStart,
  fallback,
}: {
  track: HTMLElement | null;
  viewport: HTMLElement | null;
  visibleSlides: number;
  windowStart: number;
  fallback: number;
}) => {
  if (!track || !viewport) return fallback;

  const slotSize = getTrackSlotSize(viewport, visibleSlides);
  if (slotSize <= 0) return fallback;

  const translateX = getTranslateX(track);

  return windowStart + -translateX / slotSize;
};
