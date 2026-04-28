const parseLengthValue = (rawValue: string) => {
  const value = Number.parseFloat(rawValue);
  return Number.isFinite(value) ? value : 0;
};

export const getTrackSlotSize = (
  viewport: HTMLElement,
  visibleSlidesNr: number,
) => {
  const viewportWidth = viewport.offsetWidth;
  const styles = window.getComputedStyle(viewport);
  const gapValue =
    styles.getPropertyValue("--gap") ||
    styles.getPropertyValue("gap") ||
    styles.getPropertyValue("column-gap");
  const gap = parseLengthValue(gapValue);

  return (viewportWidth + gap) / visibleSlidesNr;
};

export const getVirtualVelocityFromPointerVelocity = (
  pointerVelocity: number,
  slotSize: number,
) => {
  if (!Number.isFinite(pointerVelocity) || !(slotSize > 0)) {
    return 0;
  }

  return -(pointerVelocity / slotSize);
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

  return baseVirtualIndex - dragOffset / slotSize;
};
