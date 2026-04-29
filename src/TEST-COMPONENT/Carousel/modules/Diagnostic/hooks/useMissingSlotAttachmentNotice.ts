import { useMemo } from "react";
import { type DevNoticeEntry, useGroupedDevNotice } from "../../../../../shared";
import type { CarouselSlotAttachmentNoticeInput } from "../../../core/model/diagnostic";

const MISSING_SLOT_ATTACHMENT_NOTICE_SCOPE = "Carousel modules";
const MISSING_SLOT_ATTACHMENT_NOTICE_SUMMARY =
  "Enabled modules are not mounted.";

const EMPTY_NOTICE_ENTRIES: DevNoticeEntry[] = [];

export function useMissingSlotAttachmentNotice({
  isControlsOn,
  hasControlsSlot,
  isPaginationOn,
  hasPaginationSlot,
}: CarouselSlotAttachmentNoticeInput): void {
  const entries = useMemo<DevNoticeEntry[]>(() => {
    if (!import.meta.env.DEV) {
      return EMPTY_NOTICE_ENTRIES;
    }

    const nextEntries: DevNoticeEntry[] = [];

    if (isControlsOn && !hasControlsSlot) {
      nextEntries.push({
        field: "controls",
        message:
          "`isControlsOn` is enabled, but the `controls` slot is empty. Mount `<Controls />` or disable `isControlsOn`.",
      });
    }

    if (isPaginationOn && !hasPaginationSlot) {
      nextEntries.push({
        field: "pagination",
        message:
          "`isPaginationOn` is enabled, but the `pagination` slot is empty. Mount `<Pagination />` or disable `isPaginationOn`.",
      });
    }

    return nextEntries.length > 0 ? nextEntries : EMPTY_NOTICE_ENTRIES;
  }, [hasControlsSlot, hasPaginationSlot, isControlsOn, isPaginationOn]);

  useGroupedDevNotice({
    scope: MISSING_SLOT_ATTACHMENT_NOTICE_SCOPE,
    summary: MISSING_SLOT_ATTACHMENT_NOTICE_SUMMARY,
    entries,
  });
}
