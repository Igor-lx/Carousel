import { memo, useMemo } from "react";
import { injectSlot, useGroupedDevNotice } from "../../../../shared";
import { useCarouselNormalizationContext } from "../../core/model/context";
import {
  PARTIAL_PAGE_LAYOUT_NOTICE_SCOPE,
  PARTIAL_PAGE_LAYOUT_NOTICE_SUMMARY,
} from "../../core/hooks/usePartialPageLayoutNotice";
import { collectCarouselNormalizationNoticeEntries } from "./normalization-notices";

const NORMALIZATION_NOTICE_SCOPE = "CarouselNormalization";
const NORMALIZATION_NOTICE_SUMMARY =
  "Carousel normalization adjustments detected.";

const CarouselNormalizationView = memo(() => {
  const { rawNormalizationInput, layoutNoticeEntries } =
    useCarouselNormalizationContext();

  const normalizationNoticeEntries = useMemo(
    () => collectCarouselNormalizationNoticeEntries(rawNormalizationInput),
    [rawNormalizationInput],
  );

  useGroupedDevNotice({
    scope: NORMALIZATION_NOTICE_SCOPE,
    summary: NORMALIZATION_NOTICE_SUMMARY,
    entries: normalizationNoticeEntries,
  });

  useGroupedDevNotice({
    scope: PARTIAL_PAGE_LAYOUT_NOTICE_SCOPE,
    summary: PARTIAL_PAGE_LAYOUT_NOTICE_SUMMARY,
    entries: layoutNoticeEntries,
  });

  return null;
});

export const CarouselNormalization = injectSlot(
  CarouselNormalizationView,
  "normalization",
);

export default CarouselNormalization;
