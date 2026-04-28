export const getClampedVisibleSlidesCount = (
  slidesLength: number,
  visibleSlidesNr: number,
) => Math.min(visibleSlidesNr, slidesLength);
