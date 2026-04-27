import { useMemo } from "react";

import type { CarouselDiagnosticContextValue } from "../model/context";
import {
  EMPTY_DIAGNOSTIC_CORRECTIONS,
  type CarouselDiagnosticPayload,
  type CarouselPerfectPageLayoutNoticeInput,
} from "../model/diagnostic";

type PerfectPageLayoutInfo = Omit<
  CarouselPerfectPageLayoutNoticeInput,
  "visibleSlidesCount"
>;

interface UseCarouselDiagnosticContextValueProps {
  diagnosticPayload: CarouselDiagnosticPayload | null;
  perfectPageLayoutInfo: PerfectPageLayoutInfo;
  visibleSlidesCount: number;
  isControlsOn: boolean;
  hasControlsSlot: boolean;
  isPaginationOn: boolean;
  hasPaginationSlot: boolean;
}

export function useCarouselDiagnosticContextValue({
  diagnosticPayload,
  perfectPageLayoutInfo,
  visibleSlidesCount,
  isControlsOn,
  hasControlsSlot,
  isPaginationOn,
  hasPaginationSlot,
}: UseCarouselDiagnosticContextValueProps): CarouselDiagnosticContextValue {
  const perfectPageLayoutNoticeInput = useMemo(
    () => ({
      ...perfectPageLayoutInfo,
      visibleSlidesCount,
    }),
    [perfectPageLayoutInfo, visibleSlidesCount],
  );

  const slotAttachmentNoticeInput = useMemo(
    () => ({
      isControlsOn,
      hasControlsSlot,
      isPaginationOn,
      hasPaginationSlot,
    }),
    [
      hasControlsSlot,
      hasPaginationSlot,
      isControlsOn,
      isPaginationOn,
    ],
  );

  return useMemo(
    () => ({
      correctionEntries:
        diagnosticPayload?.correctionEntries ?? EMPTY_DIAGNOSTIC_CORRECTIONS,
      perfectPageLayoutNoticeInput,
      slotAttachmentNoticeInput,
    }),
    [
      diagnosticPayload?.correctionEntries,
      perfectPageLayoutNoticeInput,
      slotAttachmentNoticeInput,
    ],
  );
}
