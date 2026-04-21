export const getCarouselTransform = (
  index: number,
  visibleSlidesNr: number,
): string =>
  `translateX(calc(-${index} * (100% + var(--gap, 0px)) / ${visibleSlidesNr}))`;

export const applyTrackPositionStyle = (
  track: HTMLElement,
  position: number,
  windowStart: number,
  visibleSlidesNr: number,
) => {
  const relativeIndex = position - windowStart;
  track.style.transform = `${getCarouselTransform(relativeIndex, visibleSlidesNr)} translateX(0px)`;
  track.style.transition = "none";
};

export const getSlideFlexStyle = (
  visibleSlidesNr: number,
): { flex: string } => ({
  flex: `0 0 calc((100% - (var(--gap, 0px) * ${visibleSlidesNr - 1})) / ${visibleSlidesNr})`,
});
