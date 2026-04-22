import { memo, useEffect } from "react";
import { injectSlot, useGroupedDevNotice } from "../../../../shared";
import {
  type CarouselDiagnosticResolver,
} from "../../core/model/diagnostic";
import { useCarouselDiagnosticContext } from "../../core/model/context";
import { resolveCarouselDiagnostic } from "./model/resolveCarouselDiagnostic";
import { usePerfectPageLayoutNotice } from "./usePerfectPageLayoutNotice";

const DIAGNOSTIC_NOTICE_SCOPE = "CarouselDiagnostic";
const DIAGNOSTIC_NOTICE_SUMMARY =
  "Carousel diagnostic adjustments detected.";
const DIAGNOSTIC_MODE_BANNER = "DIAGNOSTIC MODE ON";

const CarouselDiagnosticView = memo(() => {
  const { correctionEntries, perfectPageLayoutNoticeInput } =
    useCarouselDiagnosticContext();

  useEffect(() => {
    console.info(DIAGNOSTIC_MODE_BANNER);
  }, []);

  useGroupedDevNotice({
    scope: DIAGNOSTIC_NOTICE_SCOPE,
    summary: DIAGNOSTIC_NOTICE_SUMMARY,
    entries: correctionEntries,
  });

  usePerfectPageLayoutNotice(perfectPageLayoutNoticeInput);

  return null;
});

type CarouselDiagnosticSlotComponent = typeof CarouselDiagnosticView & {
  slot: "diagnostic";
  resolveDiagnostic: CarouselDiagnosticResolver;
};

export const CarouselDiagnostic = injectSlot(
  CarouselDiagnosticView,
  "diagnostic",
) as CarouselDiagnosticSlotComponent;

CarouselDiagnostic.resolveDiagnostic = resolveCarouselDiagnostic;

export default CarouselDiagnostic;
