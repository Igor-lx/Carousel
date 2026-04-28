import type { ReducerAction, State } from "./types";
import { clamp, normalizePageIndex } from "../../utilities";
import {
  CLEARED_TRANSIENT_MOTION_STATE,
  getDragReleaseAnimationMode,
  getAnimStatus,
  hasReachedDragTarget,
  reconcileStateToLayout,
  resolveRepeatedClickPlan,
  resolveStepTransition,
} from "./helpers";

export function reducer(state: State, action: ReducerAction): State {
  const syncedState = reconcileStateToLayout(state, action.layout);
  const { currentLayout, animMode } = syncedState;
  const status = getAnimStatus(animMode);

  switch (action.type) {
    case "START_DRAG": {
      const dragTargetIndex =
        action.targetIndex ?? syncedState.targetIndex;
      const dragOrigin =
        action.fromVirtualIndex ?? syncedState.virtualIndex;

      return {
        ...syncedState,
        activeIndex: dragTargetIndex,
        targetIndex: dragTargetIndex,
        fromVirtualIndex: dragOrigin,
        virtualIndex: dragOrigin,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        animMode: "none",
        moveReason: "gesture",
      };
    }

    case "END_DRAG": {
      const dragReleaseOrigin =
        action.fromVirtualIndex ?? syncedState.virtualIndex;
      const nextTargetIndex = currentLayout.isFinite
        ? clamp(action.targetIndex, 0, currentLayout.pageCount - 1)
        : normalizePageIndex(action.targetIndex, currentLayout.pageCount);

      if (
        hasReachedDragTarget(
          dragReleaseOrigin,
          action.targetVirtualIndex,
          action.dragReleaseEpsilon,
        )
      ) {
        return {
          ...syncedState,
          activeIndex: nextTargetIndex,
          targetIndex: nextTargetIndex,
          fromVirtualIndex: action.targetVirtualIndex,
          virtualIndex: action.targetVirtualIndex,
          ...CLEARED_TRANSIENT_MOTION_STATE,
          animMode: "none",
          moveReason: "gesture",
        };
      }

      return {
        ...syncedState,
        targetIndex: nextTargetIndex,
        fromVirtualIndex: dragReleaseOrigin,
        virtualIndex: action.targetVirtualIndex,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        animMode: getDragReleaseAnimationMode(action),
        moveReason: "gesture",
        gesturePointerReleaseVelocity: action.isInstant
          ? 0
          : action.pointerReleaseVelocity,
        gestureUiReleaseVelocity: action.isInstant
          ? 0
          : action.uiReleaseVelocity,
      };
    }

    case "MOVE":
    case "GO_TO": {
      const {
        nextFromVirtualIndex,
        nextTargetIndex,
        nextVirtualIndex,
        animationMode,
      } = resolveStepTransition(syncedState, action);
      const repeatedClickPlan =
        action.moveReason === "click" &&
        !action.isInstant &&
        action.type === "MOVE" &&
        Math.abs(action.step) > 0
          ? resolveRepeatedClickPlan({
              state: syncedState,
              fromVirtualIndex: nextFromVirtualIndex,
              step: action.step,
              repeatedClickSettings: action.repeatedClickSettings,
            })
          : null;
      const plannedTargetIndex =
        repeatedClickPlan?.nextTargetIndex ?? nextTargetIndex;
      const followUpVirtualIndex = repeatedClickPlan?.followUpVirtualIndex ?? null;
      const plannedVirtualIndex =
        repeatedClickPlan?.nextAdvanceVirtualIndex ?? nextVirtualIndex;

      if (
        repeatedClickPlan === null &&
        plannedTargetIndex === syncedState.targetIndex &&
        plannedVirtualIndex === syncedState.virtualIndex &&
        followUpVirtualIndex === null
      ) {
        if (action.moveReason === "gesture") {
          return {
            ...syncedState,
            fromVirtualIndex: nextFromVirtualIndex,
            ...CLEARED_TRANSIENT_MOTION_STATE,
            animMode: "snap",
            moveReason: "gesture",
          };
        }
        return {
          ...syncedState,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: plannedVirtualIndex,
          ...CLEARED_TRANSIENT_MOTION_STATE,
          animMode: action.isInstant ? "instant" : syncedState.animMode,
          moveReason: action.moveReason,
        };
      }

      return {
        ...syncedState,
        targetIndex: plannedTargetIndex,
        fromVirtualIndex: nextFromVirtualIndex,
        virtualIndex: plannedVirtualIndex,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        followUpVirtualIndex,
        isRepeatedClickAdvance: repeatedClickPlan !== null,
        animMode: animationMode,
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
          ...CLEARED_TRANSIENT_MOTION_STATE,
          animMode: "normal",
          moveReason: "click",
        };
      }

      return {
        ...syncedState,
        activeIndex: syncedState.targetIndex,
        fromVirtualIndex: syncedState.virtualIndex,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        animMode: "none",
      };
    }

    default:
      return syncedState;
  }
}
