import type { ReducerAction, State } from ".";
import {
  getAlignedVirtualIndex,
  getPageStart,
} from "../../utilities";
import {
  getAnimStatus,
  reconcileStateToLayout,
  resolveRepeatedClickPlan,
  resolveStepAction,
} from "./helpers";

const DRAG_RELEASE_EPSILON = 0.001;

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
        followUpVirtualIndex: null,
        isRepeatedClickAdvance: false,
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

      if (Math.abs(snapOrigin - snapTarget) < DRAG_RELEASE_EPSILON) {
        return {
          ...syncedState,
          fromVirtualIndex: snapTarget,
          virtualIndex: snapTarget,
          followUpVirtualIndex: null,
          isRepeatedClickAdvance: false,
          animMode: "none",
          moveReason: "gesture",
        };
      }

      return {
        ...syncedState,
        fromVirtualIndex: snapOrigin,
        virtualIndex: snapTarget,
        followUpVirtualIndex: null,
        isRepeatedClickAdvance: false,
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
      const repeatedClickPlan =
        action.moveReason === "click" &&
        !action.isInstant &&
        action.type === "MOVE" &&
        Math.abs(action.step) > 0
          ? resolveRepeatedClickPlan({
              state: syncedState,
              fromVirtualIndex: nextFromVirtualIndex,
              step: action.step,
            })
          : null;
      const resolvedTargetIndex =
        repeatedClickPlan?.nextTargetIndex ?? nextTargetIndex;
      const followUpVirtualIndex = repeatedClickPlan?.followUpVirtualIndex ?? null;
      const resolvedVirtualIndex =
        repeatedClickPlan?.nextAdvanceVirtualIndex ?? nextVirtualIndex;

      if (
        repeatedClickPlan === null &&
        resolvedTargetIndex === syncedState.targetIndex &&
        resolvedVirtualIndex === syncedState.virtualIndex &&
        followUpVirtualIndex === null
      ) {
        if (action.moveReason === "gesture") {
          return {
            ...syncedState,
            fromVirtualIndex: nextFromVirtualIndex,
            followUpVirtualIndex: null,
            isRepeatedClickAdvance: false,
            animMode: "snap",
            moveReason: "gesture",
          };
        }
        return {
          ...syncedState,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: resolvedVirtualIndex,
          followUpVirtualIndex: null,
          isRepeatedClickAdvance: false,
          animMode: action.isInstant ? "instant" : syncedState.animMode,
          moveReason: action.moveReason,
        };
      }

      return {
        ...syncedState,
        targetIndex: resolvedTargetIndex,
        fromVirtualIndex: nextFromVirtualIndex,
        virtualIndex: resolvedVirtualIndex,
        followUpVirtualIndex,
        isRepeatedClickAdvance: repeatedClickPlan !== null,
        animMode: mode,
        moveReason: action.moveReason,
      };
    }

    case "END_STEP": {
      if (status.isIdle) return syncedState;

      if (syncedState.followUpVirtualIndex !== null) {
        return {
          ...syncedState,
          fromVirtualIndex: syncedState.virtualIndex,
          virtualIndex: syncedState.followUpVirtualIndex,
          followUpVirtualIndex: null,
          isRepeatedClickAdvance: false,
          animMode: "normal",
          moveReason: "click",
        };
      }

      return {
        ...syncedState,
        activeIndex: syncedState.targetIndex,
        fromVirtualIndex: syncedState.virtualIndex,
        followUpVirtualIndex: null,
        isRepeatedClickAdvance: false,
        animMode: "none",
      };
    }

    default:
      return syncedState;
  }
}
