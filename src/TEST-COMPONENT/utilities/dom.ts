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

const getTranslateX = (track: HTMLElement) => {
  const transform = window.getComputedStyle(track).transform;

  if (!transform || transform === "none") return 0;

  if (transform.startsWith("matrix3d(")) {
    const values = transform
      .slice("matrix3d(".length, -1)
      .split(",")
      .map((part) => Number.parseFloat(part.trim()));

    return Number.isFinite(values[12]) ? values[12] : 0;
  }

  if (transform.startsWith("matrix(")) {
    const values = transform
      .slice("matrix(".length, -1)
      .split(",")
      .map((part) => Number.parseFloat(part.trim()));

    return Number.isFinite(values[4]) ? values[4] : 0;
  }

  return 0;
};

interface CurrentVirtualIndexFromDomParams {
  track: HTMLElement | null;
  viewport: HTMLElement | null;
  visibleSlidesNr: number;
  windowStart: number;
  fallback: number;
}

export const getCurrentVirtualIndexFromDOM = ({
  track,
  viewport,
  visibleSlidesNr,
  windowStart,
  fallback,
}: CurrentVirtualIndexFromDomParams) => {
  if (!track || !viewport) return fallback;

  const slotSize = getTrackSlotSize(viewport, visibleSlidesNr);
  if (slotSize <= 0) return fallback;

  const translateX = getTranslateX(track);

  return windowStart + -translateX / slotSize;
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
