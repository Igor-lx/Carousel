import { useEffect } from "react";

interface PerfectLayoutProps {
  length: number;
  visibleSlidesNr: number;
}

export function usePerfectLayoutNotice({
  length,
  visibleSlidesNr,
}: PerfectLayoutProps): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const isUnperfectLayout =
      length > 0 && visibleSlidesNr > 0 && length % visibleSlidesNr !== 0;

    if (isUnperfectLayout) {
      console.warn(
        `[CarouselMulti]: Perfect UI layout requires slide count (${length}) ` +
          `to be evenly divisible by visibleSlidesNr (${visibleSlidesNr}). `,
      );
    }
  }, [length, visibleSlidesNr]);
}
