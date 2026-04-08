import { useEffect } from "react";

interface PerfectLayoutProps {
  length: number;
  visibleSlides: number;
}

export function usePerfectLayoutNotice({
  length,
  visibleSlides,
}: PerfectLayoutProps): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const isUnperfectLayout =
      length > 0 && visibleSlides > 0 && length % visibleSlides !== 0;

    if (isUnperfectLayout) {
      console.warn(
        `[CarouselMulti]: Perfect UI layout requires slide count (${length}) ` +
          `to be evenly divisible by visibleSlides (${visibleSlides}). ` +
          `Current remainder: ${length % visibleSlides}.`,
      );
    }
  }, [length, visibleSlides]);
}
