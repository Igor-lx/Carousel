import { useEffect } from "react";

interface PerfectLayoutProps {
  readonly length: number;
  readonly visibleSlides: number;
}

export function usePerfectLayoutNotice({
  length,
  visibleSlides,
}: PerfectLayoutProps): void {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (length > 0 && visibleSlides > 0 && length % visibleSlides !== 0) {
        console.warn(
          `[CarouselMulti]: Perfect UI layout requires slide count (${length}) ` +
            `to be evenly divisible by visibleSlides (${visibleSlides}).`,
        );
      }
    }
  }, [length, visibleSlides]);
}
