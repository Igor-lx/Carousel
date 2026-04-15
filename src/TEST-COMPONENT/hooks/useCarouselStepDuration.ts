import { useCallback, useEffect, useRef } from "react";

import { MIN_DURATION, VELOCITY_COEFFICIENT } from "../model/constants";
import type { MoveReason } from "../model/reducer";

interface StepDurationProps {
  isMoving: boolean;
  stepDuration: number;
}

interface StepDurationResult {
  activeStepDuration: number;
  prepareStepDuration: (moveReason: MoveReason) => void;
  resetStepDuration: () => void;
}

export function useCarouselStepDuration({
  isMoving,
  stepDuration,
}: StepDurationProps): StepDurationResult {
  const durationRef = useRef(stepDuration);
  const lastActionTimeRef = useRef(0);

  useEffect(() => {
    if (!isMoving) {
      durationRef.current = stepDuration;
      lastActionTimeRef.current = 0;
    }
  }, [isMoving, stepDuration]);

  const prepareStepDuration = useCallback(
    (moveReason: MoveReason) => {
      const now = performance.now();
      const isQuickInput =
        now - lastActionTimeRef.current < durationRef.current + 50;

      if ((isMoving || isQuickInput) && moveReason === "click") {
        durationRef.current = Math.max(
          durationRef.current * VELOCITY_COEFFICIENT,
          MIN_DURATION,
        );
      }

      lastActionTimeRef.current = now;
    },
    [isMoving],
  );

  const resetStepDuration = useCallback(() => {
    durationRef.current = stepDuration;
    lastActionTimeRef.current = 0;
  }, [stepDuration]);

  return {
    activeStepDuration: durationRef.current,
    prepareStepDuration,
    resetStepDuration,
  };
}
