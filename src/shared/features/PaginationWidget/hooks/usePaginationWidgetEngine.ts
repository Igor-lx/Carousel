import { useCallback, useEffect, useRef, type Dispatch } from "react";
import { useTimer } from "../../../../shared";
import { normalizePaginationWidgetDurationOverride } from "../model/paginationWidgetConfig";
import type {
  PaginationWidgetAction,
  PaginationWidgetMoveDirection,
  PaginationWidgetState,
} from "../model/paginationWidgetTypes";

export function usePaginationWidgetEngine(
  state: PaginationWidgetState,
  dispatch: Dispatch<PaginationWidgetAction>,
  config: {
    delay: number;
    duration: number;
    isStopped: boolean;
    isStoppedRef: { current: boolean };
  },
) {
  const { set: setWaitTimer, clear: clearWaitTimer } = useTimer();
  const { set: setMoveTimer, clear: clearMoveTimer } = useTimer();
  const stateRef = useRef(state);
  const defaultDurationRef = useRef(config.duration);
  const configuredDurationRef = useRef<number | null>(null);
  const activeDurationRef = useRef(config.duration);

  stateRef.current = state;
  config.isStoppedRef.current = config.isStopped;

  const getResolvedDuration = useCallback(
    () => configuredDurationRef.current ?? defaultDurationRef.current,
    [],
  );

  const dispatchIfActive = useCallback(
    (
      action: PaginationWidgetAction,
      canDispatch: (currentState: PaginationWidgetState) => boolean,
    ) => {
      if (config.isStoppedRef.current || !canDispatch(stateRef.current)) {
        return;
      }

      dispatch(action);
    },
    [config.isStoppedRef, dispatch],
  );

  useEffect(() => {
    defaultDurationRef.current = config.duration;

    if (state.mode !== "MOVING") {
      activeDurationRef.current = getResolvedDuration();
    }
  }, [config.duration, getResolvedDuration, state.mode]);

  useEffect(() => {
    if (!config.isStopped) {
      return;
    }

    clearWaitTimer();
    clearMoveTimer();

    if (state.mode !== "IDLE") {
      dispatch({ type: "STOP" });
    }
  }, [
    clearMoveTimer,
    clearWaitTimer,
    config.isStopped,
    dispatch,
    state.mode,
  ]);

  useEffect(() => {
    if (config.isStopped) {
      clearWaitTimer();
      return;
    }

    if (state.mode === "WAITING") {
      const scheduledRequestId = state.requestId;
      const run = () =>
        dispatchIfActive(
          { type: "BEGIN_MOVE" },
          (currentState) =>
            currentState.mode === "WAITING" &&
            currentState.requestId === scheduledRequestId,
        );

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
    config.isStopped,
    dispatchIfActive,
    setWaitTimer,
    state.mode,
    state.requestId,
  ]);

  useEffect(() => {
    if (config.isStopped) {
      clearMoveTimer();
      return;
    }

    if (state.mode === "MOVING") {
      const scheduledRequestId = state.requestId;
      const scheduledVisualOffset = state.visualOffset;

      setMoveTimer(
        () =>
          dispatchIfActive(
            { type: "COMPLETE_MOVE" },
            (currentState) =>
              currentState.mode === "MOVING" &&
              currentState.requestId === scheduledRequestId &&
              currentState.visualOffset === scheduledVisualOffset,
          ),
        activeDurationRef.current,
      );
    }

    return clearMoveTimer;
  }, [
    clearMoveTimer,
    config.isStopped,
    dispatchIfActive,
    setMoveTimer,
    state.mode,
    state.requestId,
    state.visualOffset,
  ]);

  const requestMovement = useCallback(
    (direction: PaginationWidgetMoveDirection) => {
      if (config.isStoppedRef.current) {
        return;
      }

      activeDurationRef.current = getResolvedDuration();
      dispatch({ type: "REQUEST_MOVE", direction });
    },
    [config.isStoppedRef, dispatch, getResolvedDuration],
  );

  const setDuration = useCallback(
    (duration: number | null) => {
      configuredDurationRef.current =
        normalizePaginationWidgetDurationOverride(duration);

      if (stateRef.current.mode !== "MOVING") {
        activeDurationRef.current = getResolvedDuration();
      }
    },
    [getResolvedDuration],
  );

  return {
    requestMovement,
    activeDuration: activeDurationRef.current,
    setDuration,
  };
}
