const parseLengthValue = (rawValue: string) => {
  const value = Number.parseFloat(rawValue);
  return Number.isFinite(value) ? value : 0;
};

export const getTrackSlotSize = (
  viewport: HTMLElement,
  visibleSlidesCount: number,
) => {
  const viewportWidth = viewport.offsetWidth;
  const styles = window.getComputedStyle(viewport);
  const gapValue =
    styles.getPropertyValue("--gap") ||
    styles.getPropertyValue("gap") ||
    styles.getPropertyValue("column-gap");
  const gap = parseLengthValue(gapValue);

  return (viewportWidth + gap) / visibleSlidesCount;
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

interface GetVirtualIndexFromDragOffsetInput {
  baseVirtualIndex: number;
  dragOffset: number;
  viewport: HTMLElement | null;
  visibleSlidesCount: number;
  fallback: number;
}

export const getVirtualIndexFromDragOffset = ({
  baseVirtualIndex,
  dragOffset,
  viewport,
  visibleSlidesCount,
  fallback,
}: GetVirtualIndexFromDragOffsetInput) => {
  if (!viewport) return fallback;

  const slotSize = getTrackSlotSize(viewport, visibleSlidesCount);

  return baseVirtualIndex - dragOffset / slotSize;
};
