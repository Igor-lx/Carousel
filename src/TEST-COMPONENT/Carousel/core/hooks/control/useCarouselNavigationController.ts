import { useCallback } from "react";

import type { Action, MoveReason } from "../../model/reducer";

interface UseCarouselNavigationControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  readCurrentPosition: () => number;
}

interface UseCarouselNavigationControllerResult {
  move: (step: number, moveReason?: MoveReason) => void;
  goTo: (pageIndex: number, moveReason?: MoveReason) => void;
}

export function useCarouselNavigationController({
  dispatchAction,
  enabled,
  readCurrentPosition,
}: UseCarouselNavigationControllerProps): UseCarouselNavigationControllerResult {
  const move = useCallback(
    (step: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;

      dispatchAction({
        type: "MOVE",
        step,
        moveReason,
        fromVirtualIndex: readCurrentPosition(),
      });
    },
    [dispatchAction, enabled, readCurrentPosition],
  );

  const goTo = useCallback(
    (pageIndex: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;

      dispatchAction({
        type: "GO_TO",
        targetPageIndex: pageIndex,
        moveReason,
        fromVirtualIndex: readCurrentPosition(),
      });
    },
    [dispatchAction, enabled, readCurrentPosition],
  );

  return {
    move,
    goTo,
  };
}
