import type { ReducerAction, State } from ".";
import {
  clamp,
  normalizePageIndex,
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
      const dragTargetIndex =
        action.targetIndex ?? syncedState.targetIndex;

      return {
        ...syncedState,
        activeIndex: dragTargetIndex,
        targetIndex: dragTargetIndex,
        fromVirtualIndex: action.fromVirtualIndex ?? syncedState.virtualIndex,
        virtualIndex: action.fromVirtualIndex ?? syncedState.virtualIndex,
        followUpVirtualIndex: null,
        isRepeatedClickAdvance: false,
        animMode: "none",
        moveReason: "gesture",
        gestureReleaseVelocity: 0,
      };

    case "END_DRAG":
      const dragReleaseOrigin =
        action.fromVirtualIndex ?? syncedState.virtualIndex;
      const resolvedTargetIndex = currentLayout.isFinite
        ? clamp(action.targetIndex, 0, currentLayout.pageCount - 1)
        : normalizePageIndex(action.targetIndex, currentLayout.pageCount);

      if (
        Math.abs(dragReleaseOrigin - action.targetVirtualIndex) <
        DRAG_RELEASE_EPSILON
      ) {
        return {
          ...syncedState,
          activeIndex: resolvedTargetIndex,
          targetIndex: resolvedTargetIndex,
          fromVirtualIndex: action.targetVirtualIndex,
          virtualIndex: action.targetVirtualIndex,
          followUpVirtualIndex: null,
          isRepeatedClickAdvance: false,
          animMode: "none",
          moveReason: "gesture",
          gestureReleaseVelocity: 0,
        };
      }

      return {
        ...syncedState,
        targetIndex: resolvedTargetIndex,
        fromVirtualIndex: dragReleaseOrigin,
        virtualIndex: action.targetVirtualIndex,
        followUpVirtualIndex: null,
        isRepeatedClickAdvance: false,
        animMode: action.isSnap ? "snap" : "normal",
        moveReason: "gesture",
        gestureReleaseVelocity: action.releaseVelocity,
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
            gestureReleaseVelocity: 0,
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
          gestureReleaseVelocity: 0,
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
        gestureReleaseVelocity: 0,
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
          gestureReleaseVelocity: 0,
        };
      }

      return {
        ...syncedState,
        activeIndex: syncedState.targetIndex,
        fromVirtualIndex: syncedState.virtualIndex,
        followUpVirtualIndex: null,
        isRepeatedClickAdvance: false,
        animMode: "none",
        gestureReleaseVelocity: 0,
      };
    }

    default:
      return syncedState;
  }
}
