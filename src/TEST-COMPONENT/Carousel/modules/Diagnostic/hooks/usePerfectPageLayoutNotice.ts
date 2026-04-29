import { useMemo } from "react";
import { type DevNoticeEntry, useGroupedDevNotice } from "../../../../../shared";
import type { CarouselPerfectPageLayoutNoticeInput } from "../../../core/model/diagnostic";

export const PERFECT_PAGE_LAYOUT_NOTICE_SCOPE = "Carousel layout";
export const PERFECT_PAGE_LAYOUT_NOTICE_SUMMARY =
  "Slide pages are uneven.";

const EMPTY_NOTICE_ENTRIES: DevNoticeEntry[] = [];

export function usePerfectPageLayoutNotice({
  hasPerfectPageLayout,
  rawLength,
  extendedLength,
  visibleSlidesCount,
  didExtendLayout,
}: CarouselPerfectPageLayoutNoticeInput): void {
  const entries = useMemo<DevNoticeEntry[]>(() => {
    if (hasPerfectPageLayout) {
      return EMPTY_NOTICE_ENTRIES;
    }

    const mismatchMessage =
      `${rawLength} slides cannot be split evenly into pages of ${visibleSlidesCount}`;

    if (!didExtendLayout) {
      return [
        {
          field: "page layout",
          message:
            `${mismatchMessage}. Pagination uses fixed page steps, so raw slide groups may drift.`,
        },
        {
          field: "suggestion",
          message:
            "Enable isPagePaddingOn to pad the final page.",
        },
      ];
    }

    return [
      {
        field: "page layout",
        message: mismatchMessage,
      },
      {
        field: "padded page layout",
        provided: rawLength,
        normalized: extendedLength,
        reason:
          `Added ${extendedLength - rawLength} clone(s) from the start of slidesData to complete the final page`,
      },
    ];
  }, [
    didExtendLayout,
    extendedLength,
    hasPerfectPageLayout,
    rawLength,
    visibleSlidesCount,
  ]);

  useGroupedDevNotice({
    scope: PERFECT_PAGE_LAYOUT_NOTICE_SCOPE,
    summary: PERFECT_PAGE_LAYOUT_NOTICE_SUMMARY,
    entries,
  });
}
