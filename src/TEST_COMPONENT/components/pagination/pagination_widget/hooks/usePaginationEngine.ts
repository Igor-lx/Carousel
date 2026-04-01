import { useEffect, useCallback } from "react";
import type { PaginationState, PaginationAction } from "../types";
import { useTimer } from "./useTimer";
import { ANIMATION_END_BUFFER } from "../const";

export function usePaginationEngine(
  state: PaginationState,
  dispatch: React.Dispatch<PaginationAction>,
  config: { delay: number; duration: number },
) {
  const waitTimer = useTimer();
  const moveTimer = useTimer();


  const scheduleEnd = useCallback(
    (duration: number) => {
      moveTimer.set(
        () => dispatch({ type: "END_STEP" }),
        duration + ANIMATION_END_BUFFER,
      );
    },
    [dispatch, moveTimer],
  );


  useEffect(() => {
    waitTimer.clear();
    if (state.mode === "WAITING") {
      const delay = state.activeDelay;
      delay > 0
        ? waitTimer.set(() => dispatch({ type: "START_ANIMATION" }), delay)
        : dispatch({ type: "START_ANIMATION" });
    }
    return () => waitTimer.clear();
  }, [state.mode, state.activeDelay, dispatch, waitTimer]);


  useEffect(() => {
    if (state.mode === "MOVING") {
      scheduleEnd(state.activeDuration);
    } else {
      moveTimer.clear();
    }
    return () => moveTimer.clear();
  }, [state.mode, state.activeDuration, scheduleEnd, moveTimer]);

 
  const action = useCallback(
    (direction: "next" | "prev") => {
      if (state.mode === "MOVING") {
        scheduleEnd(state.activeDuration);
      }

      dispatch({
        type: "CLICK",
        direction,
        configDelay: config.delay,
        configDuration: config.duration,
      });
    },
    [
      state.mode,
      state.activeDuration,
      config.delay,
      config.duration,
      dispatch,
      scheduleEnd,
    ],
  );

  return { action };
}
