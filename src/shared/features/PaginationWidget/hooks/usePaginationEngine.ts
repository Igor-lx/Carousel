import { useEffect, useCallback, useRef } from "react";
import type { PaginationState, PaginationAction } from "../model/types";
import { useTimer } from "../../../../shared";

import {
  ANIMATION_END_BUFFER,
  MIN_DURATION,
  VELOCITY_COEFFICIENT,
} from "../model/constants";

export function usePaginationEngine(
  state: PaginationState,
  dispatch: React.Dispatch<PaginationAction>,
  config: { delay: number; duration: number },
) {
  const waitTimer = useTimer();
  const moveTimer = useTimer();
  const defaultDurationRef = useRef(config.duration);
  const configuredDurationRef = useRef<number | null>(null);
  const activeDurationRef = useRef(config.duration);

  useEffect(() => {
    defaultDurationRef.current = config.duration;

    if (state.mode !== "IDLE") {
      return;
    }

    activeDurationRef.current =
      configuredDurationRef.current ?? defaultDurationRef.current;
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
        activeDurationRef.current + ANIMATION_END_BUFFER,
      );
    }
    return () => moveTimer.clear();
  }, [state.mode, dispatch, moveTimer]);

  const action = useCallback(
    (direction: "next" | "prev") => {
      if (configuredDurationRef.current !== null) {
        activeDurationRef.current = configuredDurationRef.current;
      } else if (state.mode === "MOVING") {
        activeDurationRef.current = Math.max(
          activeDurationRef.current * VELOCITY_COEFFICIENT,
          MIN_DURATION,
        );
      } else {
        activeDurationRef.current = defaultDurationRef.current;
      }
      dispatch({ type: "CLICK", direction });
    },
    [state.mode, dispatch],
  );

  const setDuration = useCallback(
    (duration: number | null) => {
      configuredDurationRef.current =
        typeof duration === "number" && duration > 0 ? duration : null;

      if (state.mode === "IDLE") {
        activeDurationRef.current =
          configuredDurationRef.current ?? defaultDurationRef.current;
      }
    },
    [state.mode],
  );

  return { action, activeDuration: activeDurationRef.current, setDuration };
}
