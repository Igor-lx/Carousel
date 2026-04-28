import { useCallback } from "react";
import type { Action, ReducerAction } from "../../model/reducer";
import type { CarouselRepeatedClickSettings } from "../../model/diagnostic";
import type { CarouselLayout } from "../../utilities";

interface UseCarouselEngineProps {
  dispatch: React.Dispatch<ReducerAction>;
  isMoving: boolean;
  isInstantMode: boolean;
  layout: CarouselLayout;
  dragReleaseEpsilon: number;
  repeatedClickSettings: CarouselRepeatedClickSettings;
}

interface UseCarouselEngineResult {
  dispatchAction: (action: Action) => void;
  finalizeStep: () => void;
}

export function useCarouselEngine({
  dispatch,
  isMoving,
  isInstantMode,
  layout,
  dragReleaseEpsilon,
  repeatedClickSettings,
}: UseCarouselEngineProps): UseCarouselEngineResult {
  const dispatchAction = useCallback(
    (action: Action) => {
      if (action.type === "MOVE") {
        dispatch({
          ...action,
          layout,
          repeatedClickSettings,
          isInstant: Boolean(isInstantMode || action.isInstant),
        });
        return;
      }

      if (action.type === "GO_TO") {
        dispatch({
          ...action,
          layout,
          isInstant: Boolean(isInstantMode || action.isInstant),
        });
        return;
      }

      if (action.type === "END_DRAG") {
        dispatch({
          ...action,
          layout,
          dragReleaseEpsilon,
          isInstant: Boolean(isInstantMode || action.isInstant),
        });
        return;
      }

      dispatch({
        ...action,
        layout,
      });
    },
    [dispatch, dragReleaseEpsilon, isInstantMode, layout, repeatedClickSettings],
  );

  const finalizeStep = useCallback(() => {
    if (!isMoving) return;
    dispatchAction({ type: "END_STEP" });
  }, [dispatchAction, isMoving]);

  return {
    dispatchAction,
    finalizeStep,
  };
}
