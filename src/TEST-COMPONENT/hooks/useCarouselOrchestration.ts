import { useCallback, useEffect } from "react";

import { useIsomorphicLayoutEffect } from "../../shared";
import { ANIMATION_SAFETY_MARGIN } from "../model/constants";
import type { Action, PendingTransition } from "../model/reducer";

interface OrchestrationProps {
  pendingTransition: PendingTransition | null;
  dispatchAction: React.Dispatch<Action>;
  finalizeStep: () => void;
  isInstant: boolean;
  isReducedMotion: boolean;
  isAnimating: boolean;
  actualDuration: number;
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
    if (pendingTransition) {
      dispatchAction({ type: "COMMIT_REBASE" });
    }
  }, [dispatchAction, pendingTransition]);

  return {
    handleTransitionEnd,
  };
}
