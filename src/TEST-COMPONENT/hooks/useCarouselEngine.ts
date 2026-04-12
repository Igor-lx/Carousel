import { useCallback, useRef } from "react";
import type { Action } from "../model/reducer";
import type { CarouselLayout } from "../utilites";
import { useIsomorphicLayoutEffect } from "../../shared";

interface EngineProps {
  dispatch: React.Dispatch<Action>;
  isMoving: boolean;
  isInstantMode: boolean;
  currentLayout: CarouselLayout;
  nextLayout: CarouselLayout;
}

export function useCarouselEngine({
  dispatch,
  isMoving,
  isInstantMode,
  currentLayout,
  nextLayout,
}: EngineProps) {
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

  useIsomorphicLayoutEffect(() => {
    if (currentLayout.dataKey === "" && nextLayout.dataKey === "") return;

    const isDataChanged = nextLayout.dataKey !== currentLayout.dataKey;

    const isLayoutChanged =
      nextLayout.totalVirtual !== currentLayout.totalVirtual ||
      nextLayout.clampedVisible !== currentLayout.clampedVisible ||
      nextLayout.isInfinite !== currentLayout.isInfinite ||
      nextLayout.pageCount !== currentLayout.pageCount;

    if (isDataChanged || isLayoutChanged) {
      componentDispatch({
        type: "RECONCILE",
        nextLayout: nextLayoutRef.current,
      });
    }
  }, [
    currentLayout, 
    nextLayout,
    componentDispatch,
  ]);

  return {
    dispatch: componentDispatch,
    finalize,
  };
}
