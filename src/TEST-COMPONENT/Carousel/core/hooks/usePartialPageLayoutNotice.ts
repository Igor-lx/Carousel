import { useEffect, useMemo } from "react";
import {
  type DevNoticeEntry,
  type DevNoticeReporter,
  useGroupedDevNotice,
} from "../../../../shared";

interface PartialPageLayoutNoticeProps {
  hasPartialPageLayout: boolean;
  rawLength: number;
  extendedLength: number;
  visibleSlidesCount: number;
  didExtendLayout: boolean;
  reporter?: DevNoticeReporter;
}

export const PARTIAL_PAGE_LAYOUT_NOTICE_SCOPE = "usePartialPageLayoutNotice";
export const PARTIAL_PAGE_LAYOUT_NOTICE_SUMMARY =
  "Partial-page layout detected.";

const EMPTY_NOTICE_ENTRIES: DevNoticeEntry[] = [];

export function usePartialPageLayoutNotice({
  hasPartialPageLayout,
  rawLength,
  extendedLength,
  visibleSlidesCount,
  didExtendLayout,
  reporter,
}: PartialPageLayoutNoticeProps): void {
  const entries = useMemo<DevNoticeEntry[]>(() => {
    if (!hasPartialPageLayout) {
      return EMPTY_NOTICE_ENTRIES;
    }

    const mismatchMessage =
      `slide count (${rawLength}) is not evenly divisible by visibleSlidesNr (${visibleSlidesCount}).`;

    if (!didExtendLayout) {
      return [
        {
          field: "partial page layout",
          message:
            `${mismatchMessage} Pagination will keep fixed page steps, while the rendered window cycles through raw slides and may drift between groups.`,
        },
        {
          field: "suggestion",
          message:
            "Enable isLayoutClamped to extend the layout to full pages and keep pagination deterministic.",
        },
      ];
    }

    return [
      {
        field: "partial page layout",
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
    hasPartialPageLayout,
    extendedLength,
    rawLength,
    visibleSlidesCount,
  ]);

  useEffect(() => {
    reporter?.(entries);
  }, [entries, reporter]);

  useGroupedDevNotice({
    scope: PARTIAL_PAGE_LAYOUT_NOTICE_SCOPE,
    summary: PARTIAL_PAGE_LAYOUT_NOTICE_SUMMARY,
    entries: reporter ? EMPTY_NOTICE_ENTRIES : entries,
  });
}
