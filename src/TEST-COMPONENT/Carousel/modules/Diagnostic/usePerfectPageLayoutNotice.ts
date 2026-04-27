import { useMemo } from "react";
import { type DevNoticeEntry, useGroupedDevNotice } from "../../../../shared";
import type { CarouselPerfectPageLayoutNoticeInput } from "../../core/model/diagnostic";

export const PERFECT_PAGE_LAYOUT_NOTICE_SCOPE = "usePerfectPageLayoutNotice";
export const PERFECT_PAGE_LAYOUT_NOTICE_SUMMARY =
  "Perfect page layout conditions were not met.";

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
      `slide count (${rawLength}) is not evenly divisible by visibleSlidesNr (${visibleSlidesCount}).`;

    if (!didExtendLayout) {
      return [
        {
          field: "perfect page layout",
          message:
            `${mismatchMessage} Pagination will keep fixed page steps, while the rendered window cycles through raw slides and may drift between groups.`,
        },
        {
          field: "suggestion",
          message:
            "Enable isPagePaddingOn to extend the layout to full pages and keep pagination deterministic.",
        },
      ];
    }

    return [
      {
        field: "perfect page layout",
        message: mismatchMessage,
      },
      {
        field: "extended page layout",
        provided: rawLength,
        normalized: extendedLength,
        reason:
          `appended ${extendedLength - rawLength} slide clone(s) from the start of slidesData to keep pagination deterministic`,
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
