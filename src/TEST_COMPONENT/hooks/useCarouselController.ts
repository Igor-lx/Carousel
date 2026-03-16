import { useCallback } from "react";
import type { Action, MoveReason } from "../types/reducer.types";


interface ControllerProps {
  readonly dispatch: React.Dispatch<Action>;
  readonly finalize: () => void;
  readonly onReset: () => void;
  readonly enabled: boolean;
}

interface ControllerResult {
  readonly move: (step: number, moveReason?: MoveReason) => void;
  readonly goTo: (index: number, moveReason?: MoveReason) => void;
  readonly dragStart: () => void;
  readonly dragSnap: () => void;
  readonly finalize: () => void;
}

export function useCarouselController({
  dispatch,
  finalize,
  onReset,
  enabled,
}: ControllerProps): ControllerResult {
  const action = useCallback(
    (actionFn: () => void) => {
      onReset();
      actionFn();
    },
    [onReset],
  );

  const move = useCallback(
    (step: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;
      action(() => dispatch({ type: "MOVE", step, moveReason }));
    },
    [enabled, action, dispatch],
  );

  const goTo = useCallback(
    (index: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;
      action(() => dispatch({ type: "GO_TO", target: index, moveReason }));
    },
    [enabled, action, dispatch],
  );

  const dragStart = useCallback(() => {
    action(() => dispatch({ type: "START_DRAG" }));
  }, [action, dispatch]);

  const dragSnap = useCallback(() => {
    dispatch({ type: "END_DRAG_SNAP" });
  }, [dispatch]);

  const safeFinalize = useCallback(() => {
    onReset();
    finalize();
  }, [onReset, finalize]);

  return {
    move,
    goTo,
    dragStart,
    dragSnap,
    finalize: safeFinalize,
  };
}
