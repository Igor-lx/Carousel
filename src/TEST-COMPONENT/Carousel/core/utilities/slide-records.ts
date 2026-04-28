import type { Slide } from "../types";
import type { CarouselSlideRecord } from "./types";

const getClampedVisibleSlidesCount = (
  slidesLength: number,
  visibleSlidesNr: number,
) => Math.min(visibleSlidesNr, slidesLength);

const createSlideRecord = (
  slideData: Slide,
  layoutIndex: number,
  isLayoutClone: boolean,
): CarouselSlideRecord => ({
  slideData,
  layoutIndex,
  slideKey: isLayoutClone
    ? `slide:${String(slideData.id)}:layout-clone:${layoutIndex}`
    : `slide:${String(slideData.id)}`,
});

export const buildSlideRecords = (
  slidesData: Slide[],
): CarouselSlideRecord[] =>
  slidesData.map((slideData, index) =>
    createSlideRecord(slideData, index, false),
  );

export const hasPartialPageLayout = (
  slidesLength: number,
  visibleSlidesNr: number,
): boolean => {
  if (slidesLength === 0) return false;

  const clampedVisibleCount = getClampedVisibleSlidesCount(
    slidesLength,
    visibleSlidesNr,
  );

  return slidesLength % clampedVisibleCount !== 0;
};

export const extendSlideRecordsToFullPages = (
  slideRecords: CarouselSlideRecord[],
  visibleSlidesNr: number,
): CarouselSlideRecord[] => {
  const length = slideRecords.length;

  if (!hasPartialPageLayout(length, visibleSlidesNr)) {
    return slideRecords;
  }

  const clampedVisibleCount = getClampedVisibleSlidesCount(
    length,
    visibleSlidesNr,
  );
  const extendedLength =
    Math.ceil(length / clampedVisibleCount) * clampedVisibleCount;
  const appendedSlides = Array.from({ length: extendedLength - length }).map(
    (_, offset) => {
      const sourceIndex = offset % length;
      const sourceSlide = slideRecords[sourceIndex]!;

      return createSlideRecord(sourceSlide.slideData, length + offset, true);
    },
  );

  return [...slideRecords, ...appendedSlides];
};
