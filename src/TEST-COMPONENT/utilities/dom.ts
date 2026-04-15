const parseLengthValue = (rawValue: string) => {
  const value = Number.parseFloat(rawValue);
  return Number.isFinite(value) ? value : 0;
};

const getTrackSlotSize = (viewport: HTMLElement, visibleSlidesNr: number) => {
  if (visibleSlidesNr <= 0) return 0;

  const viewportWidth = viewport.offsetWidth;
  const styles = window.getComputedStyle(viewport);
  const gapValue =
    styles.getPropertyValue("--gap") ||
    styles.getPropertyValue("gap") ||
    styles.getPropertyValue("column-gap");
  const gap = parseLengthValue(gapValue);

  return (viewportWidth + gap) / visibleSlidesNr;
};

interface VirtualIndexFromDragOffsetParams {
  baseVirtualIndex: number;
  dragOffset: number;
  viewport: HTMLElement | null;
  visibleSlidesNr: number;
  fallback: number;
}

export const getVirtualIndexFromDragOffset = ({
  baseVirtualIndex,
  dragOffset,
  viewport,
  visibleSlidesNr,
  fallback,
}: VirtualIndexFromDragOffsetParams) => {
  if (!viewport) return fallback;

  const slotSize = getTrackSlotSize(viewport, visibleSlidesNr);
  if (slotSize <= 0) return fallback;

  return baseVirtualIndex - dragOffset / slotSize;
};
