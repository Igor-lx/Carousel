interface TrackPositionStyle {
  transform: string;
  transition: string;
}

const getTrackTransform = (
  index: number,
  visibleSlidesNr: number,
): string =>
  `translateX(calc(-${index} * (100% + var(--gap, 0px)) / ${visibleSlidesNr}))`;

export const getTrackPositionStyle = (
  position: number,
  windowStart: number,
  visibleSlidesNr: number,
): TrackPositionStyle => {
  const relativeIndex = position - windowStart;

  return {
    transform: `${getTrackTransform(relativeIndex, visibleSlidesNr)} translateX(0px)`,
    transition: "none",
  };
};
