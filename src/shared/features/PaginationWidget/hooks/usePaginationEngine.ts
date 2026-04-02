import { useEffect, useCallback, useRef } from "react";
import type { PaginationState, PaginationAction } from "../model/types";

import {
  ANIMATION_END_BUFFER,
  MIN_DURATION,
  VELOCITY_COEFFICIENT,
} from "../model/constants";
import { useTimer } from "../../../../shared";

export function usePaginationEngine(
  state: PaginationState,
  dispatch: React.Dispatch<PaginationAction>,
  config: { delay: number; duration: number },
) {
  const waitTimer = useTimer();
  const moveTimer = useTimer();
  const durationRef = useRef(config.duration);

  useEffect(() => {
    if (state.mode === "IDLE") durationRef.current = config.duration;
  }, [state.mode, config.duration]);

  useEffect(() => {
    if (state.mode === "WAITING") {
      const run = () => dispatch({ type: "START_ANIMATION" });
      config.delay > 0 ? waitTimer.set(run, config.delay) : run();
    }
    return () => waitTimer.clear();
  }, [state.mode, config.delay, dispatch, waitTimer]);

  useEffect(() => {
    if (state.mode === "MOVING") {
      moveTimer.set(
        () => dispatch({ type: "END_STEP" }),
        durationRef.current + ANIMATION_END_BUFFER,
      );
    }
    return () => moveTimer.clear();
  }, [state.mode, dispatch, moveTimer]);

  const action = useCallback(
    (direction: "next" | "prev") => {
      if (state.mode === "MOVING") {
        durationRef.current = Math.max(
          durationRef.current * VELOCITY_COEFFICIENT,
          MIN_DURATION,
        );
      }
      dispatch({ type: "CLICK", direction });
    },
    [state.mode, dispatch],
  );

  return { action, activeDuration: durationRef.current };
}
