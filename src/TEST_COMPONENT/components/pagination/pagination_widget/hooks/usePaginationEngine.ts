import { useEffect, useCallback, useRef } from "react";
import type { PaginationState, PaginationAction } from "../types";
import { useTimer } from "./useTimer";
import {
  ANIMATION_END_BUFFER,
  MIN_DURATION,
  VELOCITY_COEFFICIENT,
} from "../const";

export function usePaginationEngine(
  state: PaginationState,
  dispatch: React.Dispatch<PaginationAction>,
  config: { delay: number; duration: number },
) {
  const waitTimer = useTimer();
  const moveTimer = useTimer();

  // Храним текущую длительность в ref для предотвращения stale closures
  const currentDurationRef = useRef(config.duration);

  // Логика ускорения при спаме кликами
  useEffect(() => {
    if (state.mode === "MOVING") {
      currentDurationRef.current = Math.max(
        currentDurationRef.current * VELOCITY_COEFFICIENT,
        MIN_DURATION,
      );
    } else if (state.mode === "IDLE") {
      currentDurationRef.current = config.duration;
    }
  }, [state.mode, config.duration]);

  // Реакция на переход в WAITING
  useEffect(() => {
    if (state.mode === "WAITING") {
      if (config.delay > 0) {
        waitTimer.set(
          () => dispatch({ type: "START_ANIMATION" }),
          config.delay,
        );
      } else {
        dispatch({ type: "START_ANIMATION" });
      }
    }
    return () => waitTimer.clear();
  }, [state.mode, config.delay, dispatch, waitTimer]);

  // Реакция на переход в MOVING (Единственное место запуска таймера завершения)
  useEffect(() => {
    if (state.mode === "MOVING") {
      moveTimer.set(
        () => dispatch({ type: "END_STEP" }),
        currentDurationRef.current + ANIMATION_END_BUFFER,
      );
    }
    return () => moveTimer.clear();
  }, [state.mode, state.step, dispatch, moveTimer]); // Перезапуск при изменении шага внутри движения

  const action = useCallback(
    (direction: "next" | "prev") => {
      dispatch({ type: "CLICK", direction });
    },
    [dispatch],
  );

  return { action, activeDuration: currentDurationRef.current };
}
