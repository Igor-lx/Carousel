import { useEffect } from "react";

interface PerfectLayoutProps {
  hasImperfectLayout: boolean;
  originalLength: number;
  normalizedLength: number;
  visibleSlidesNr: number;
  isLayoutClamped: boolean;
}

export function usePerfectLayoutNotice({
  hasImperfectLayout,
  originalLength,
  normalizedLength,
  visibleSlidesNr,
  isLayoutClamped,
}: PerfectLayoutProps): void {
  useEffect(() => {
    if (!import.meta.env.DEV || !hasImperfectLayout) {
      return;
    }

    if (!isLayoutClamped) {
      console.warn(
        `[CarouselMulti]->[usePerfectLayoutNotice]: Layout mismatch detected: slide count (${originalLength}) ` +
          `is not evenly divisible by visibleSlidesNr (${visibleSlidesNr}). ` +
          `Pagination still counts fixed page steps, but the rendered window will cycle ` +
          `through raw slides and drift between groups. You may enable isLayoutClamped prop to pad ` +
          `the layout and keep pagination deterministic.`,
      );

      return;
    }

    console.warn(
      `[CarouselMulti]->[usePerfectLayoutNotice]: Layout mismatch detected: slide count (${originalLength}) ` +
        `is not evenly divisible by visibleSlidesNr (${visibleSlidesNr}). ` +
        `[isLayoutClamped] prop has padded the virtual slide set to ${normalizedLength} by appending ` +
        `${normalizedLength - originalLength} slide clone(s) from the start of slidesData. ` +
        `Duplicated slides may appear in the last page, but pagination is now stable and deterministic.`,
    );
  }, [
    hasImperfectLayout,
    originalLength,
    normalizedLength,
    visibleSlidesNr,
    isLayoutClamped,
  ]);
}
