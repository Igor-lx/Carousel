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
  const stepSize = currentLayout.clampedVisible;

  switch (action.type) {
    case "START_DRAG":
      return {
        ...syncedState,
        fromVirtualIndex: action.fromVirtualIndex ?? syncedState.virtualIndex,
        virtualIndex: action.fromVirtualIndex ?? syncedState.virtualIndex,
        animMode: "none",
        pendingTransition: null,
      };

    case "END_DRAG_SNAP":
      const snapOrigin = action.fromVirtualIndex ?? syncedState.virtualIndex;
      const snapTarget = currentLayout.isFinite
        ? getPageStart(syncedState.targetIndex, stepSize)
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
          pendingTransition: null,
        };
      }

      return {
        ...syncedState,
        fromVirtualIndex: snapOrigin,
        virtualIndex: snapTarget,
        animMode: "snap",
        moveReason: "gesture",
        pendingTransition: null,
      };

    case "MOVE":
    case "GO_TO": {
      const {
        nextFromVirtualIndex,
        nextTargetIndex,
        nextVirtualIndex,
        mode,
      } = resolveStepAction(syncedState, action);
      const shouldRebase =
        status.isAnimating &&
        mode !== "instant" &&
        Math.abs(nextFromVirtualIndex - syncedState.virtualIndex) > 0.001;

      if (shouldRebase) {
        const pendingAnimMode = action.type === "GO_TO" ? "jump" : "normal";

        return {
          ...syncedState,
          pendingTransition: {
            targetIndex: nextTargetIndex,
            renderVirtualIndex: nextVirtualIndex,
            animMode: pendingAnimMode,
            moveReason: action.moveReason,
            phase: "capture",
          },
        };
      }

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
            pendingTransition: null,
          };
        }
        return {
          ...syncedState,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: nextVirtualIndex,
          animMode: action.isInstant ? "instant" : syncedState.animMode,
          moveReason: action.moveReason,
          pendingTransition: null,
        };
      }

      return {
        ...syncedState,
        targetIndex: nextTargetIndex,
        fromVirtualIndex: nextFromVirtualIndex,
        virtualIndex: nextVirtualIndex,
        animMode: mode,
        moveReason: action.moveReason,
        pendingTransition: null,
      };
    }

    case "APPLY_REBASE_ORIGIN": {
      if (!syncedState.pendingTransition) return syncedState;

      return {
        ...syncedState,
        fromVirtualIndex: action.fromVirtualIndex,
        virtualIndex: action.fromVirtualIndex,
        animMode: "rebase",
        moveReason: syncedState.pendingTransition.moveReason,
        pendingTransition: {
          ...syncedState.pendingTransition,
          phase: "ready",
        },
      };
    }

    case "COMMIT_REBASE": {
      if (!syncedState.pendingTransition) return syncedState;

      const nextVirtualIndex = currentLayout.isFinite
        ? getPageStart(syncedState.pendingTransition.targetIndex, stepSize)
        : getAlignedVirtualIndex(
            syncedState.pendingTransition.targetIndex,
            syncedState.virtualIndex,
            currentLayout,
          );

      return {
        ...syncedState,
        targetIndex: syncedState.pendingTransition.targetIndex,
        virtualIndex: nextVirtualIndex,
        animMode: syncedState.pendingTransition.animMode,
        moveReason: syncedState.pendingTransition.moveReason,
        pendingTransition: null,
      };
    }

    case "END_STEP": {
      if (status.isIdle) return syncedState;

      return {
        ...syncedState,
        activeIndex: syncedState.targetIndex,
        fromVirtualIndex: syncedState.virtualIndex,
        animMode: "none",
        pendingTransition: null,
      };
    }

    default:
      return syncedState;
  }
}
