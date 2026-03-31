import { useEffect } from "react";
import type { PaginationState, PaginationAction } from "../types";
import { useTimer } from "./useTimer";
import { ANIMATION_END_BUFFER } from "../const";

export function usePaginationEngine(
  state: PaginationState,
  dispatch: React.Dispatch<PaginationAction>,
  config: { delay: number; duration: number }
) {
  const waitTimer = useTimer();
  const moveTimer = useTimer();

  useEffect(() => {
    waitTimer.clear();
    if (state.mode === "WAITING") {
      if (state.activeDelay > 0) {
        waitTimer.set(() => dispatch({ type: "START_ANIMATION" }), state.activeDelay);
      } else {
        dispatch({ type: "START_ANIMATION" });
      }
    }
  }, [state.mode, dispatch]);

  useEffect(() => {
    moveTimer.clear();
    if (state.mode === "MOVING") {
      moveTimer.set(
        () => dispatch({ type: "END_STEP" }),
        state.activeDuration + ANIMATION_END_BUFFER
      );
    }
    return () => moveTimer.clear();
  }, [state.mode, state.step, state.activeDuration, dispatch]);

  return {
    action: (direction: "next" | "prev") => {
      dispatch({ 
        type: "CLICK", 
        direction, 
        configDelay: config.delay, 
        configDuration: config.duration 
      });
    }
  };
}