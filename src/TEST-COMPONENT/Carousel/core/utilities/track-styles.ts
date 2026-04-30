interface TrackPositionStyle {
  transform: string;
  transition: string;
}

const getTrackTransform = (
  index: number,
  visibleSlidesCount: number,
): string =>
  `translateX(calc(-${index} * (100% + var(--slides-gap, 0px)) / ${visibleSlidesCount}))`;

export const getTrackPositionStyle = (
  position: number,
  renderWindowStart: number,
  visibleSlidesCount: number,
): TrackPositionStyle => {
  const relativeIndex = position - renderWindowStart;

  return {
    transform: `${getTrackTransform(relativeIndex, visibleSlidesCount)} translateX(0px)`,
    transition: "none",
  };
};
