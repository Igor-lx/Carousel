import { useCallback } from "react";
import type { CarouselExternalController } from "../model/context";
import type { Action, MoveReason } from "../model/reducer";


interface ControllerProps {
  dispatch: React.Dispatch<Action>;
  finalize: () => void;
  onReset: () => void;
  enabled: boolean;
  externalController: React.RefObject<CarouselExternalController | null>;
}

interface ControllerResult {
  move: (step: number, moveReason?: MoveReason) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
  dragStart: () => void;
  dragSnap: () => void;
  finalize: () => void;
}

export function useCarouselController({
  dispatch,
  finalize,
  onReset,
  enabled,
  externalController,
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

      if (step > 0) externalController.current?.moveRight?.();
      else if (step < 0) externalController.current?.moveLeft?.();

      action(() => dispatch({ type: "MOVE", step, moveReason }));
    },
    [enabled, action, dispatch, externalController],
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
