import { memo, useEffect } from "react";
import { useGroupedDevNotice } from "../../../../shared";
import { type CarouselDiagnosticResolver } from "../../core/model/diagnostic";
import { useCarouselDiagnosticContext } from "../../core/model/context";
import type { CarouselSlotComponent } from "../../core/model/slots";
import { resolveCarouselDiagnostic } from "./model/resolveCarouselDiagnostic";
import { useMissingSlotAttachmentNotice } from "./hooks/useMissingSlotAttachmentNotice";
import { usePerfectPageLayoutNotice } from "./hooks/usePerfectPageLayoutNotice";

const DIAGNOSTIC_NOTICE_SCOPE = "CarouselDiagnostic";
const DIAGNOSTIC_NOTICE_SUMMARY =
  "Carousel diagnostic notices detected.";
const DIAGNOSTIC_MODE_BANNER = "DIAGNOSTIC MODE ON";

const CarouselDiagnosticView = memo(() => {
  const {
    correctionEntries,
    perfectPageLayoutNoticeInput,
    slotAttachmentNoticeInput,
  } =
    useCarouselDiagnosticContext();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.info(DIAGNOSTIC_MODE_BANNER);
  }, []);

  useGroupedDevNotice({
    scope: DIAGNOSTIC_NOTICE_SCOPE,
    summary: DIAGNOSTIC_NOTICE_SUMMARY,
    entries: correctionEntries,
  });

  useMissingSlotAttachmentNotice(slotAttachmentNoticeInput);
  usePerfectPageLayoutNotice(perfectPageLayoutNoticeInput);

  return null;
});

type CarouselDiagnosticSlotComponent = CarouselSlotComponent<
  typeof CarouselDiagnosticView,
  "diagnostic"
> & {
  resolveDiagnostic: CarouselDiagnosticResolver;
};

export const CarouselDiagnostic: CarouselDiagnosticSlotComponent =
  Object.assign(CarouselDiagnosticView, {
    slot: "diagnostic" as const,
    resolveDiagnostic: resolveCarouselDiagnostic,
  });

export default CarouselDiagnostic;
