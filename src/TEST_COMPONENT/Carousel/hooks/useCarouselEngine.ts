import { useCallback, useEffect, useRef } from "react";
import type { Action, CarouselLayout } from "../types";
import { useIsomorphicLayoutEffect } from ".";

interface EngineProps {
  readonly dispatch: React.Dispatch<Action>;
  readonly isMoving: boolean;
  readonly isInstantMode: boolean;
  readonly currentLayout: CarouselLayout;
  readonly nextLayout: CarouselLayout;
  readonly pendingAction: Action | null;
}

interface EngineResult {
  readonly dispatch: React.Dispatch<Action>;
  readonly finalize: () => void;
}
export function useCarouselEngine({
  dispatch,
  isMoving,
  isInstantMode,
  currentLayout,
  nextLayout,
  pendingAction,
}: EngineProps): EngineResult {
  const nextLayoutRef = useRef(nextLayout);
  nextLayoutRef.current = nextLayout;

  const componentDispatch = useCallback(
    (action: Action) => {
      if (action.type === "MOVE" || action.type === "GO_TO") {
        dispatch({
          ...action,
          isInstant: !!(isInstantMode || action.isInstant),
        });
      } else {
        dispatch(action);
      }
    },
    [isInstantMode, dispatch],
  );

  const finalize = useCallback(() => {
    if (!isMoving) return;

    componentDispatch({ type: "END_STEP" });
  }, [isMoving, componentDispatch]);

  useEffect(() => {
    if (!isMoving && pendingAction) {
      componentDispatch(pendingAction);
      componentDispatch({ type: "CLEAR_PENDING" });
    }
  }, [isMoving, pendingAction, componentDispatch]);

  useIsomorphicLayoutEffect(() => {
    if (currentLayout.dataKey === "" && nextLayout.dataKey === "") return;

    const isDataChanged = nextLayout.dataKey !== currentLayout.dataKey;

    const isLayoutChanged =
      nextLayout.totalVirtual !== currentLayout.totalVirtual ||
      nextLayout.clampedVisible !== currentLayout.clampedVisible ||
      nextLayout.isInfinite !== currentLayout.isInfinite;

    if (isDataChanged || isLayoutChanged) {
      componentDispatch({
        type: "RECONCILE",
        nextLayout: nextLayoutRef.current,
      });
    }
  }, [
    currentLayout.dataKey,
    currentLayout.totalVirtual,
    currentLayout.clampedVisible,
    currentLayout.isInfinite,
    nextLayout.dataKey,
    nextLayout.totalVirtual,
    nextLayout.clampedVisible,
    nextLayout.isInfinite,
    componentDispatch,
  ]);

  return {
    dispatch: componentDispatch,
    finalize,
  };
}
