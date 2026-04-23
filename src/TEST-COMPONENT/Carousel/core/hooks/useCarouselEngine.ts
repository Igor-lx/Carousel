import { useCallback } from "react";
import type { Action, ReducerAction, StepAction } from "../model/reducer";
import type {
  CarouselDragSettings,
  CarouselRepeatedClickSettings,
} from "../model/diagnostic";
import type { CarouselLayout } from "../utilities";

interface EngineProps {
  dispatch: React.Dispatch<ReducerAction>;
  isMoving: boolean;
  isInstantMode: boolean;
  layout: CarouselLayout;
  dragSettings: CarouselDragSettings;
  repeatedClickSettings: CarouselRepeatedClickSettings;
}

interface EngineResult {
  dispatchAction: (action: Action) => void;
  finalizeStep: () => void;
}

const isStepAction = (action: Action): action is StepAction =>
  action.type === "MOVE" || action.type === "GO_TO";

export function useCarouselEngine({
  dispatch,
  isMoving,
  isInstantMode,
  layout,
  dragSettings,
  repeatedClickSettings,
}: EngineProps): EngineResult {
  const dispatchAction = useCallback(
    (action: Action) => {
      if (isStepAction(action)) {
        dispatch({
          ...action,
          layout,
          dragSettings,
          repeatedClickSettings,
          isInstant: Boolean(isInstantMode || action.isInstant),
        });
        return;
      }

      if (action.type === "END_DRAG") {
        dispatch({
          ...action,
          layout,
          dragSettings,
          repeatedClickSettings,
          isInstant: Boolean(isInstantMode || action.isInstant),
        });
        return;
      }

      dispatch({
        ...action,
        layout,
        dragSettings,
        repeatedClickSettings,
      });
    },
    [dispatch, dragSettings, isInstantMode, layout, repeatedClickSettings],
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
