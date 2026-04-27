import { useMemo } from "react";

import type { CarouselPerfectPageLayoutNoticeInput } from "../model/diagnostic";
import type { Slide } from "../types";
import {
  buildSlideRecords,
  extendSlideRecordsToFullPages,
  hasPartialPageLayout,
  type CarouselSlideRecord,
} from "../utilities";

type PerfectPageLayoutInfo = Omit<
  CarouselPerfectPageLayoutNoticeInput,
  "visibleSlidesCount"
>;

interface UseCarouselResolvedSlideRecordsProps {
  slidesData: Slide[];
  visibleSlidesCount: number;
  isPagePaddingOn: boolean;
}

interface UseCarouselResolvedSlideRecordsResult {
  resolvedSlideRecords: CarouselSlideRecord[];
  perfectPageLayoutInfo: PerfectPageLayoutInfo;
}

export function useCarouselResolvedSlideRecords({
  slidesData,
  visibleSlidesCount,
  isPagePaddingOn,
}: UseCarouselResolvedSlideRecordsProps): UseCarouselResolvedSlideRecordsResult {
  const totalSlides = slidesData.length;
  const hasPartialPageLayoutMismatch = hasPartialPageLayout(
    totalSlides,
    visibleSlidesCount,
  );
  const didExtendPartialPageLayout =
    isPagePaddingOn && hasPartialPageLayoutMismatch;

  const normalizedSlideRecords = useMemo(
    () => buildSlideRecords(slidesData),
    [slidesData],
  );

  const resolvedSlideRecords = useMemo(
    () =>
      didExtendPartialPageLayout
        ? extendSlideRecordsToFullPages(
            normalizedSlideRecords,
            visibleSlidesCount,
          )
        : normalizedSlideRecords,
    [
      didExtendPartialPageLayout,
      normalizedSlideRecords,
      visibleSlidesCount,
    ],
  );

  const perfectPageLayoutInfo = useMemo(
    () => ({
      hasPerfectPageLayout: !hasPartialPageLayoutMismatch,
      rawLength: totalSlides,
      extendedLength: resolvedSlideRecords.length,
      didExtendLayout: didExtendPartialPageLayout,
    }),
    [
      didExtendPartialPageLayout,
      hasPartialPageLayoutMismatch,
      resolvedSlideRecords.length,
      totalSlides,
    ],
  );

  return {
    resolvedSlideRecords,
    perfectPageLayoutInfo,
  };
}
