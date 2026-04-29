export const getClampedVisibleSlidesCount = (
  slidesLength: number,
  visibleSlidesCount: number,
) => Math.min(visibleSlidesCount, slidesLength);
