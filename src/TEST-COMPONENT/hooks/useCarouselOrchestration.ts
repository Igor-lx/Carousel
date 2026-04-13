import { useCallback, useEffect } from "react";

import { useIsomorphicLayoutEffect } from "../../shared";
import { ANIMATION_SAFETY_MARGIN } from "../model/constants";
import type { Action, PendingTransition } from "../model/reducer";

interface OrchestrationProps {
  pendingTransition: PendingTransition | null;
  dispatch: React.Dispatch<Action>;
  finalize: () => void;
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
  dispatch,
  finalize,
  isInstant,
  isReducedMotion,
  isAnimating,
  actualDuration,
}: OrchestrationProps): OrchestrationResult {
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName === "transform" && e.target === e.currentTarget) {
        finalize();
      }
    },
    [finalize],
  );

  useIsomorphicLayoutEffect(() => {
    if (isInstant || (isReducedMotion && isAnimating)) {
      finalize();
    }
  }, [isInstant, isReducedMotion, isAnimating, finalize]);

  useEffect(() => {
    if (!isAnimating || actualDuration <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      finalize();
    }, actualDuration + ANIMATION_SAFETY_MARGIN);

    return () => window.clearTimeout(timeout);
  }, [isAnimating, actualDuration, finalize]);

  useEffect(() => {
    if (pendingTransition) {
      dispatch({ type: "COMMIT_REBASE" });
    }
  }, [pendingTransition, dispatch]);

  return {
    handleTransitionEnd,
  };
}
