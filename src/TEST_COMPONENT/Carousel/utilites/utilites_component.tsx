import type { Slide, CarouselLayout, SlideA11yProps } from "../types";

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

export const getSlideMetadata = (
  vIndex: number,
  { length, virtualLength, cloneCount, canSlide }: CarouselLayout,
) => {
  if (!canSlide) return { originalIndex: vIndex, isClone: false };

  let isClone = false;
  let virtualNormalizedIndex: number;

  if (vIndex < cloneCount) {
    isClone = true;
    virtualNormalizedIndex =
      (virtualLength - (cloneCount - vIndex)) % virtualLength;
  } else if (vIndex >= cloneCount + virtualLength) {
    isClone = true;
    virtualNormalizedIndex =
      (vIndex - cloneCount - virtualLength) % virtualLength;
  } else {
    virtualNormalizedIndex = vIndex - cloneCount;
  }

  const originalIndex = ((virtualNormalizedIndex % length) + length) % length;

  return { originalIndex, isClone };
};

export const getSlideVisibility = (
  vIndex: number,
  currentIndex: number,
  prevIndex: number | null,
  clampedVisible: number,
  isAnimating: boolean,
) => {
  const isActual =
    vIndex >= currentIndex && vIndex < currentIndex + clampedVisible;

  if (isAnimating) {
    const startIdx = prevIndex ?? currentIndex;
    const wasVisible = vIndex >= startIdx && vIndex < startIdx + clampedVisible;
    return { isActual, isActive: isActual || wasVisible };
  }
  return { isActual, isActive: isActual };
};

export const getCarouselTransform = (
  index: number,
  visible: number,
): string => {
  return `translateX(calc(calc(-${index} * (100% + var(--gap, 0px)) / ${visible}) + var(--drag-offset, 0px)))`;
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
