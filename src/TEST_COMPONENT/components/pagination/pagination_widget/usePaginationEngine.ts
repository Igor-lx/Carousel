import { useCallback, useEffect } from "react";
import { useTimer } from "./useTimer";
import type { PaginationAction, AnimationMode } from "./types";

interface EngineProps {
  dispatch: React.Dispatch<PaginationAction>;
  mode: AnimationMode;
  step: number;
  duration: number;
  configDelay: number;
  configDuration: number;
}

export function usePaginationEngine({
  dispatch,
  mode,
  step,
  duration,
  configDelay,
  configDuration,
}: EngineProps) {
  const waitTimer = useTimer();
  const moveTimer = useTimer();

  const action = useCallback(
    (direction: "next" | "prev") => {
      waitTimer.clear();
      dispatch({ type: "CLICK", direction, configDelay, configDuration });

      if (mode !== "moving") {
        const d = mode === "none" ? configDelay : 0;
        if (d > 0) {
          waitTimer.set(
            () => dispatch({ type: "START_ANIMATION", direction }),
            d,
          );
        } else {
          dispatch({ type: "START_ANIMATION", direction });
        }
      }
    },
    [mode, configDelay, configDuration, dispatch, waitTimer],
  );

  useEffect(() => {
    if (mode === "moving") {
      moveTimer.set(() => dispatch({ type: "END_STEP" }), duration + 50);
    }
  }, [step, mode, duration, dispatch, moveTimer]);

  return { action };
}
