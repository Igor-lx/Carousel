import { useMemo } from "react";
import { type DevNoticeEntry, useGroupedDevNotice } from "../../../../../shared";
import type { CarouselSlotAttachmentNoticeInput } from "../../../core/model/diagnostic";

const MISSING_SLOT_ATTACHMENT_NOTICE_SCOPE = "useMissingSlotAttachmentNotice";
const MISSING_SLOT_ATTACHMENT_NOTICE_SUMMARY =
  "Enabled carousel modules are missing slot attachments.";

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
        field: "controls module",
        message:
          "`isControlsOn` is enabled, but no module is attached to the `controls` slot. Mount `<Controls />` or disable `isControlsOn`.",
      });
    }

    if (isPaginationOn && !hasPaginationSlot) {
      nextEntries.push({
        field: "pagination module",
        message:
          "`isPaginationOn` is enabled, but no module is attached to the `pagination` slot. Mount `<Pagination />` or disable `isPaginationOn`.",
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
