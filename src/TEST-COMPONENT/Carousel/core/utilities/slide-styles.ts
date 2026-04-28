export const getSlideFlexStyle = (
  visibleSlidesNr: number,
): { flex: string } => ({
  flex: `0 0 calc((100% - (var(--gap, 0px) * ${visibleSlidesNr - 1})) / ${visibleSlidesNr})`,
});
