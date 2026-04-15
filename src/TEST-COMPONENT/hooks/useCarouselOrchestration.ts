import { useCallback, useEffect } from "react";

import { useIsomorphicLayoutEffect } from "../../shared";
import { ANIMATION_SAFETY_MARGIN } from "../model/constants";
import type { Action, PendingTransition } from "../model/reducer";
import { getCurrentVirtualIndexFromDOM } from "../utilities";

interface OrchestrationProps {
  pendingTransition: PendingTransition | null;
  dispatchAction: React.Dispatch<Action>;
  finalizeStep: () => void;
  isInstant: boolean;
  isReducedMotion: boolean;
  isAnimating: boolean;
  actualDuration: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  visibleSlidesNr: number;
  windowStart: number;
  fallbackVirtualIndex: number;
}

interface OrchestrationResult {
  handleTransitionEnd: (e: React.TransitionEvent<HTMLDivElement>) => void;
}

export function useCarouselOrchestration({
  pendingTransition,
  dispatchAction,
  finalizeStep,
  isInstant,
  isReducedMotion,
  isAnimating,
  actualDuration,
  trackRef,
  viewportRef,
  visibleSlidesNr,
  windowStart,
  fallbackVirtualIndex,
}: OrchestrationProps): OrchestrationResult {
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName === "transform" && e.target === e.currentTarget) {
        finalizeStep();
      }
    },
    [finalizeStep],
  );

  useIsomorphicLayoutEffect(() => {
    if (isInstant || (isReducedMotion && isAnimating)) {
      finalizeStep();
    }
  }, [finalizeStep, isAnimating, isInstant, isReducedMotion]);

  useEffect(() => {
    if (!isAnimating || actualDuration <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      finalizeStep();
    }, actualDuration + ANIMATION_SAFETY_MARGIN);

    return () => window.clearTimeout(timeout);
  }, [actualDuration, finalizeStep, isAnimating]);

  useIsomorphicLayoutEffect(() => {
    if (!pendingTransition || pendingTransition.phase !== "capture") {
      return;
    }

    dispatchAction({
      type: "APPLY_REBASE_ORIGIN",
      fromVirtualIndex: getCurrentVirtualIndexFromDOM({
        track: trackRef.current,
        viewport: viewportRef.current,
        visibleSlidesNr,
        windowStart,
        fallback: fallbackVirtualIndex,
      }),
    });
  }, [
    dispatchAction,
    fallbackVirtualIndex,
    pendingTransition,
    trackRef,
    viewportRef,
    visibleSlidesNr,
    windowStart,
  ]);

  useEffect(() => {
    if (!pendingTransition || pendingTransition.phase !== "ready") {
      return;
    }

    // Paint the neutral rebase frame first so the next transition starts
    // from the updated DOM window on mobile as well.
    const frame = window.requestAnimationFrame(() => {
      dispatchAction({ type: "COMMIT_REBASE" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dispatchAction, pendingTransition]);

  return {
    handleTransitionEnd,
  };
}
