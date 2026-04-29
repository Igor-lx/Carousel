export const getSlideFlexStyle = (
  visibleSlidesCount: number,
): { flex: string } => ({
  flex: `0 0 calc((100% - (var(--gap, 0px) * ${visibleSlidesCount - 1})) / ${visibleSlidesCount})`,
});
