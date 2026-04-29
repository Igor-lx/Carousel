import type { Slide } from "../types";
import type { CarouselSlideRecord } from "./types";
import { getClampedVisibleSlidesCount } from "./visible-slides";

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
  visibleSlidesCount: number,
): boolean => {
  if (slidesLength === 0) return false;

  const layoutVisibleSlidesCount = getClampedVisibleSlidesCount(
    slidesLength,
    visibleSlidesCount,
  );

  return slidesLength % layoutVisibleSlidesCount !== 0;
};

export const extendSlideRecordsToFullPages = (
  slideRecords: CarouselSlideRecord[],
  visibleSlidesCount: number,
): CarouselSlideRecord[] => {
  const length = slideRecords.length;

  if (!hasPartialPageLayout(length, visibleSlidesCount)) {
    return slideRecords;
  }

  const layoutVisibleSlidesCount = getClampedVisibleSlidesCount(
    length,
    visibleSlidesCount,
  );
  const extendedLength =
    Math.ceil(length / layoutVisibleSlidesCount) * layoutVisibleSlidesCount;
  const appendedSlides = Array.from({ length: extendedLength - length }).map(
    (_, offset) => {
      const sourceIndex = offset % length;
      const sourceSlide = slideRecords[sourceIndex]!;

      return createSlideRecord(sourceSlide.slideData, length + offset, true);
    },
  );

  return [...slideRecords, ...appendedSlides];
};
