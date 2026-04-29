import { useEffect, useCallback, useRef } from "react";
import type {
  PaginationWidgetAction,
  PaginationWidgetState,
} from "../model/paginationWidgetTypes";
import { paginationWidgetReducer } from "../model/paginationWidgetReducer";
import { normalizePaginationWidgetDurationOverride } from "../model/paginationWidgetConfig";
import { useTimer } from "../../../../shared";

import {
  ANIMATION_END_BUFFER,
  MIN_DURATION,
  VELOCITY_COEFFICIENT,
} from "../model/paginationWidgetConstants";

export function usePaginationWidgetEngine(
  state: PaginationWidgetState,
  dispatch: React.Dispatch<PaginationWidgetAction>,
  config: {
    delay: number;
    duration: number;
    isFreezed: boolean;
    isFreezedRef: { current: boolean };
  },
) {
  const { set: setWaitTimer, clear: clearWaitTimer } = useTimer();
  const { set: setMoveTimer, clear: clearMoveTimer } = useTimer();
  const stateRef = useRef(state);
  const defaultDurationRef = useRef(config.duration);
  const configuredDurationRef = useRef<number | null>(null);
  const activeDurationRef = useRef(config.duration);

  stateRef.current = state;
  config.isFreezedRef.current = config.isFreezed;

  const dispatchSynced = useCallback(
    (action: PaginationWidgetAction) => {
      stateRef.current = paginationWidgetReducer(stateRef.current, action);
      dispatch(action);
    },
    [dispatch],
  );

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

    clearWaitTimer();
    clearMoveTimer();

    if (stateRef.current.mode !== "IDLE") {
      dispatchSynced({ type: "RESET" });
    }
  }, [
    clearMoveTimer,
    clearWaitTimer,
    config.isFreezed,
    dispatchSynced,
    state.mode,
  ]);

  useEffect(() => {
    if (config.isFreezed) {
      clearWaitTimer();
      return;
    }

    if (state.mode === "WAITING") {
      const scheduledRequestId = state.requestId;
      const run = () => {
        const currentState = stateRef.current;

        if (
          config.isFreezedRef.current ||
          currentState.mode !== "WAITING" ||
          currentState.requestId !== scheduledRequestId
        ) {
          return;
        }

        dispatchSynced({ type: "START_ANIMATION" });
      };

      if (config.delay > 0) {
        setWaitTimer(run, config.delay);
      } else {
        run();
      }
    }
    return clearWaitTimer;
  }, [
    clearWaitTimer,
    config.delay,
    config.isFreezed,
    config.isFreezedRef,
    dispatchSynced,
    setWaitTimer,
    state.mode,
    state.requestId,
  ]);

  useEffect(() => {
    if (config.isFreezed) {
      clearMoveTimer();
      return;
    }

    if (state.mode === "MOVING") {
      const scheduledRequestId = state.requestId;
      const scheduledStep = state.step;

      setMoveTimer(
        () => {
          const currentState = stateRef.current;

          if (
            config.isFreezedRef.current ||
            currentState.mode !== "MOVING" ||
            currentState.requestId !== scheduledRequestId ||
            currentState.step !== scheduledStep
          ) {
            return;
          }

          dispatchSynced({ type: "END_STEP" });
        },
        activeDurationRef.current + ANIMATION_END_BUFFER,
      );
    }
    return clearMoveTimer;
  }, [
    clearMoveTimer,
    config.isFreezed,
    config.isFreezedRef,
    dispatchSynced,
    setMoveTimer,
    state.mode,
    state.requestId,
    state.step,
  ]);

  const rotateWidget = useCallback(
    (direction: "next" | "prev") => {
      if (config.isFreezedRef.current) {
        return;
      }

      const currentState = stateRef.current;
      const configuredDuration = configuredDurationRef.current;
      const baseDuration = configuredDuration ?? defaultDurationRef.current;

      if (currentState.mode === "MOVING") {
        activeDurationRef.current = Math.max(
          activeDurationRef.current * VELOCITY_COEFFICIENT,
          MIN_DURATION,
        );
      } else {
        activeDurationRef.current = baseDuration;
      }
      dispatchSynced({ type: "CLICK", direction });
    },
    [config.isFreezedRef, dispatchSynced],
  );

  const setDuration = useCallback(
    (duration: number | null) => {
      configuredDurationRef.current =
        normalizePaginationWidgetDurationOverride(duration);

      if (stateRef.current.mode === "IDLE") {
        activeDurationRef.current =
          configuredDurationRef.current ?? defaultDurationRef.current;
      }
    },
    [],
  );

  return {
    rotateWidget,
    activeDuration: activeDurationRef.current,
    setDuration,
  };
}
