import { isValidElement, useMemo, type ReactNode } from "react";

import {
  type CarouselDiagnosticPayload,
  type CarouselDiagnosticPropsInput,
  type CarouselDiagnosticResolver,
  type CarouselRuntimeSettings,
  resolveRawCarouselRuntimeSettings,
} from "../../model/diagnostic";

interface UseCarouselRuntimeSettingsProps {
  diagnosticSlot: ReactNode;
  visibleSlidesNr?: unknown;
  durationAutoplay?: unknown;
  durationStep?: unknown;
  durationJump?: unknown;
  intervalAutoplay?: unknown;
  errAltPlaceholder?: unknown;
}

interface UseCarouselRuntimeSettingsResult {
  diagnosticPayload: CarouselDiagnosticPayload | null;
  runtimeSettings: CarouselRuntimeSettings;
}

export function useCarouselRuntimeSettings({
  diagnosticSlot,
  visibleSlidesNr,
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: UseCarouselRuntimeSettingsProps): UseCarouselRuntimeSettingsResult {
  const rawDiagnosticInput = useMemo<CarouselDiagnosticPropsInput>(
    () => ({
      visibleSlidesNr,
      durationAutoplay,
      durationStep,
      durationJump,
      intervalAutoplay,
      errAltPlaceholder,
    }),
    [
      durationAutoplay,
      durationJump,
      durationStep,
      errAltPlaceholder,
      intervalAutoplay,
      visibleSlidesNr,
    ],
  );

  const rawRuntimeSettings = useMemo(
    () => resolveRawCarouselRuntimeSettings(rawDiagnosticInput),
    [rawDiagnosticInput],
  );

  const diagnosticResolver = useMemo(() => {
    if (!isValidElement(diagnosticSlot)) {
      return null;
    }

    const resolver = (
      diagnosticSlot.type as { resolveDiagnostic?: CarouselDiagnosticResolver }
    ).resolveDiagnostic;

    return typeof resolver === "function" ? resolver : null;
  }, [diagnosticSlot]);

  const diagnosticPayload = useMemo(
    () => diagnosticResolver?.(rawDiagnosticInput) ?? null,
    [diagnosticResolver, rawDiagnosticInput],
  );

  return {
    diagnosticPayload,
    runtimeSettings: diagnosticPayload?.settings ?? rawRuntimeSettings,
  };
}
