import { useCallback, useEffect, useRef } from "react";
import type { AnimationMode, PaginationAction } from "../types";
import { useTimer } from ".";
import { ANIMATION_END_BUFFER } from "../const";


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

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const action = useCallback(
    (direction: "next" | "prev") => {
      waitTimer.clear();
      dispatch({ type: "CLICK", direction, configDelay, configDuration });

      if (modeRef.current !== "moving") {
        const delay = modeRef.current === "none" ? configDelay : 0;
        if (delay > 0) {
          waitTimer.set(
            () => dispatch({ type: "START_ANIMATION", direction }),
            delay,
          );
        } else {
          dispatch({ type: "START_ANIMATION", direction });
        }
      }
    },
    [configDelay, configDuration, dispatch, waitTimer],
  );

  useEffect(() => {
    if (mode === "moving") {
      moveTimer.set(
        () => dispatch({ type: "END_STEP" }),
        duration + ANIMATION_END_BUFFER,
      );
    }
  }, [step, mode, duration, dispatch, moveTimer]);

  return { action };
}
