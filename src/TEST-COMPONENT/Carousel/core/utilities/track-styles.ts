interface TrackPositionStyle {
  transform: string;
  transition: string;
}

export const getTrackPositionStyle = (
  position: number,
  renderWindowStart: number,
  slotSize: number,
): TrackPositionStyle => {
  const relativeIndex = position - renderWindowStart;
  const offsetPx = -relativeIndex * slotSize;
  const roundedOffsetPx = Math.round(offsetPx * 10000) / 10000;

  return {
    transform: `translate3d(${roundedOffsetPx}px, 0, 0)`,
    transition: "none",
  };
};
