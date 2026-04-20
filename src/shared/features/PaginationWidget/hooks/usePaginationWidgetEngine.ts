import { useEffect, useCallback, useRef } from "react";
import type {
  PaginationWidgetAction,
  PaginationWidgetState,
} from "../model/paginationWidgetTypes";
import { useTimer } from "../../../../shared";

import {
  ANIMATION_END_BUFFER,
  MIN_DURATION,
  VELOCITY_COEFFICIENT,
} from "../model/paginationWidgetConstants";

export function usePaginationWidgetEngine(
  state: PaginationWidgetState,
  dispatch: React.Dispatch<PaginationWidgetAction>,
  config: { delay: number; duration: number; isFreezed: boolean },
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
    if (!config.isFreezed) {
      return;
    }

    waitTimer.clear();
    moveTimer.clear();

    if (state.mode !== "IDLE") {
      dispatch({ type: "RESET" });
    }
  }, [config.isFreezed, dispatch, moveTimer, state.mode, waitTimer]);

  useEffect(() => {
    if (config.isFreezed) {
      waitTimer.clear();
      return;
    }

    if (state.mode === "WAITING") {
      const run = () => dispatch({ type: "START_ANIMATION" });
      config.delay > 0 ? waitTimer.set(run, config.delay) : run();
    }
    return () => waitTimer.clear();
  }, [config.delay, config.isFreezed, dispatch, state.mode, waitTimer]);

  useEffect(() => {
    if (config.isFreezed) {
      moveTimer.clear();
      return;
    }

    if (state.mode === "MOVING") {
      moveTimer.set(
        () => dispatch({ type: "END_STEP" }),
        activeDurationRef.current + ANIMATION_END_BUFFER,
      );
    }
    return () => moveTimer.clear();
  }, [config.isFreezed, dispatch, moveTimer, state.mode]);

  const rotateWidget = useCallback(
    (direction: "next" | "prev") => {
      if (config.isFreezed) {
        return;
      }

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
    [config.isFreezed, state.mode, dispatch],
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

  return {
    rotateWidget,
    activeDuration: activeDurationRef.current,
    setDuration,
  };
}
