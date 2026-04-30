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

  return {
    transform: `translateX(${offsetPx}px) translateZ(0)`,
    transition: "none",
  };
};
