import type { ReducerAction, State } from ".";
import {
  getAlignedVirtualIndex,
  getPageStart,
} from "../../utilities";
import {
  getAnimStatus,
  reconcileStateToLayout,
  resolveStepAction,
} from "./helpers";

export function reducer(state: State, action: ReducerAction): State {
  const syncedState = reconcileStateToLayout(state, action.layout);
  const { currentLayout, animMode } = syncedState;
  const status = getAnimStatus(animMode);

  switch (action.type) {
    case "START_DRAG":
      return {
        ...syncedState,
        fromVirtualIndex: action.fromVirtualIndex ?? syncedState.virtualIndex,
        virtualIndex: action.fromVirtualIndex ?? syncedState.virtualIndex,
        animMode: "none",
      };

    case "END_DRAG_SNAP":
      const snapOrigin = action.fromVirtualIndex ?? syncedState.virtualIndex;
      const snapTarget = currentLayout.isFinite
        ? getPageStart(syncedState.targetIndex, currentLayout.clampedVisible)
        : getAlignedVirtualIndex(
            syncedState.targetIndex,
            snapOrigin,
            currentLayout,
          );

      if (Math.abs(snapOrigin - snapTarget) < 0.001) {
        return {
          ...syncedState,
          fromVirtualIndex: snapTarget,
          virtualIndex: snapTarget,
          animMode: "none",
          moveReason: "gesture",
        };
      }

      return {
        ...syncedState,
        fromVirtualIndex: snapOrigin,
        virtualIndex: snapTarget,
        animMode: "snap",
        moveReason: "gesture",
      };

    case "MOVE":
    case "GO_TO": {
      const {
        nextFromVirtualIndex,
        nextTargetIndex,
        nextVirtualIndex,
        mode,
      } = resolveStepAction(syncedState, action);

      if (
        nextTargetIndex === syncedState.targetIndex &&
        nextVirtualIndex === syncedState.virtualIndex
      ) {
        if (action.moveReason === "gesture") {
          return {
            ...syncedState,
            fromVirtualIndex: nextFromVirtualIndex,
            animMode: "snap",
            moveReason: "gesture",
          };
        }
        return {
          ...syncedState,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: nextVirtualIndex,
          animMode: action.isInstant ? "instant" : syncedState.animMode,
          moveReason: action.moveReason,
        };
      }

      return {
        ...syncedState,
        targetIndex: nextTargetIndex,
        fromVirtualIndex: nextFromVirtualIndex,
        virtualIndex: nextVirtualIndex,
        animMode: mode,
        moveReason: action.moveReason,
      };
    }

    case "END_STEP": {
      if (status.isIdle) return syncedState;

      return {
        ...syncedState,
        activeIndex: syncedState.targetIndex,
        fromVirtualIndex: syncedState.virtualIndex,
        animMode: "none",
      };
    }

    default:
      return syncedState;
  }
}
