import {
  isValidElement,
  useMemo,
  type ReactNode,
  type RefObject,
} from "react";

import {
  resolveSlots,
  useComponentVisibility,
  useExternalRefBridge,
} from "../../../../shared";
import type { CarouselExternalControlHandle } from "../external-control";
import {
  type CarouselDiagnosticPayload,
  type CarouselDiagnosticPropsInput,
  type CarouselDiagnosticResolver,
  type CarouselRepeatedClickSettings,
  type CarouselRuntimeSettings,
  resolveRawCarouselRuntimeSettings,
} from "../model/diagnostic";
import { CAROUSEL_SLOTS } from "../model/slots";
import { useResponsiveRepeatedClickSettings } from "./useResponsiveRepeatedClickSettings";

type CarouselSlots = Record<(typeof CAROUSEL_SLOTS)[number], ReactNode>;

interface UseCarouselRuntimeSetupProps {
  children: ReactNode;
  containerRef: RefObject<HTMLDivElement | null>;
  isTouch: boolean;
  visibleSlidesNr?: unknown;
  durationAutoplay?: unknown;
  durationStep?: unknown;
  durationJump?: unknown;
  intervalAutoplay?: unknown;
  errAltPlaceholder?: unknown;
}

interface UseCarouselRuntimeSetupResult {
  externalControlRef: RefObject<CarouselExternalControlHandle | null>;
  slots: CarouselSlots;
  diagnosticPayload: CarouselDiagnosticPayload | null;
  runtimeSettings: CarouselRuntimeSettings;
  responsiveRepeatedClickSettings: CarouselRepeatedClickSettings;
  isVisible: boolean;
}

export function useCarouselRuntimeSetup({
  children,
  containerRef,
  isTouch,
  visibleSlidesNr,
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: UseCarouselRuntimeSetupProps): UseCarouselRuntimeSetupResult {
  const {
    instanceRef: externalControlRef,
    connectedChildren: childrenWithExternalControlRef,
  } = useExternalRefBridge<CarouselExternalControlHandle>(children);

  const slots = useMemo(
    () => resolveSlots(childrenWithExternalControlRef, CAROUSEL_SLOTS),
    [childrenWithExternalControlRef],
  );

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
    if (!isValidElement(slots.diagnostic)) {
      return null;
    }

    const resolver = (
      slots.diagnostic.type as { resolveDiagnostic?: CarouselDiagnosticResolver }
    ).resolveDiagnostic;

    return typeof resolver === "function" ? resolver : null;
  }, [slots.diagnostic]);

  const diagnosticPayload = useMemo(
    () => diagnosticResolver?.(rawDiagnosticInput) ?? null,
    [diagnosticResolver, rawDiagnosticInput],
  );

  const runtimeSettings = diagnosticPayload?.settings ?? rawRuntimeSettings;

  const responsiveRepeatedClickSettings = useResponsiveRepeatedClickSettings({
    repeatedClickSettings: runtimeSettings.repeatedClickSettings,
    isTouch,
  });

  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: runtimeSettings.interactionSettings.visibilityThreshold,
  });

  return {
    externalControlRef,
    slots,
    diagnosticPayload,
    runtimeSettings,
    responsiveRepeatedClickSettings,
    isVisible,
  };
}
