import { useCallback } from "react";
import type { Action, ReducerAction } from "../model/reducer";
import type { CarouselLayout } from "../utilites";

interface EngineProps {
  dispatch: React.Dispatch<ReducerAction>;
  isMoving: boolean;
  isInstantMode: boolean;
  layout: CarouselLayout;
}

export function useCarouselEngine({
  dispatch,
  isMoving,
  isInstantMode,
  layout,
}: EngineProps) {
  const componentDispatch = useCallback(
    (action: Action) => {
      if (action.type === "MOVE" || action.type === "GO_TO") {
        dispatch({
          ...action,
          layout,
          isInstant: !!(isInstantMode || action.isInstant),
        });
      } else {
        dispatch({
          ...action,
          layout,
        });
      }
    },
    [isInstantMode, dispatch, layout],
  );

  const finalize = useCallback(() => {
    if (!isMoving) return;
    componentDispatch({ type: "END_STEP" });
  }, [isMoving, componentDispatch]);

  return {
    dispatch: componentDispatch,
    finalize,
  };
}
