import { useCallback } from "react";

import type { Action, MoveReason } from "../../model/reducer";

interface UseCarouselNavigationControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  currentPositionRef: React.MutableRefObject<number>;
  readCurrentPosition: () => number;
}

interface UseCarouselNavigationControllerResult {
  move: (step: number, moveReason?: MoveReason) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
}

export function useCarouselNavigationController({
  dispatchAction,
  enabled,
  currentPositionRef,
  readCurrentPosition,
}: UseCarouselNavigationControllerProps): UseCarouselNavigationControllerResult {
  const resolveCurrentPosition = useCallback(() => {
    const position = readCurrentPosition();

    return Number.isFinite(position) ? position : currentPositionRef.current;
  }, [currentPositionRef, readCurrentPosition]);

  const move = useCallback(
    (step: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;

      dispatchAction({
        type: "MOVE",
        step,
        moveReason,
        fromVirtualIndex: resolveCurrentPosition(),
      });
    },
    [dispatchAction, enabled, resolveCurrentPosition],
  );

  const goTo = useCallback(
    (index: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;

      dispatchAction({
        type: "GO_TO",
        target: index,
        moveReason,
        fromVirtualIndex: resolveCurrentPosition(),
      });
    },
    [dispatchAction, enabled, resolveCurrentPosition],
  );

  return {
    move,
    goTo,
  };
}
