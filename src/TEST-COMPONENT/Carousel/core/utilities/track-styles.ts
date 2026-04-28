const getTrackTransform = (
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
  track.style.transform = `${getTrackTransform(relativeIndex, visibleSlidesNr)} translateX(0px)`;
  track.style.transition = "none";
};
