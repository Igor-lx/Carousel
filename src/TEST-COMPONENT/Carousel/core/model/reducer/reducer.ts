import type { ReducerAction, State } from "./types";
import { clamp, normalizePageIndex } from "../../utilities";
import {
  CLEARED_TRANSIENT_MOTION_STATE,
  getAnimationStatus,
} from "./state";
import {
  getDragReleaseAnimationMode,
  hasReachedDragTarget,
  reconcileStateToLayout,
  resolveRepeatedClickPlan,
  resolveStepTransition,
} from "./transitions";

export function reducer(state: State, action: ReducerAction): State {
  const syncedState = reconcileStateToLayout(state, action.layout);
  const { currentLayout, animationMode } = syncedState;
  const status = getAnimationStatus(animationMode);

  switch (action.type) {
    case "START_DRAG": {
      const dragTargetPageIndex =
        action.targetPageIndex ?? syncedState.targetPageIndex;
      const dragOrigin =
        action.fromVirtualIndex ?? syncedState.virtualIndex;

      return {
        ...syncedState,
        activePageIndex: dragTargetPageIndex,
        targetPageIndex: dragTargetPageIndex,
        fromVirtualIndex: dragOrigin,
        virtualIndex: dragOrigin,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        animationMode: "none",
        moveReason: "gesture",
      };
    }

    case "END_DRAG": {
      const dragReleaseOrigin =
        action.fromVirtualIndex ?? syncedState.virtualIndex;
      const nextTargetPageIndex = currentLayout.isFinite
        ? clamp(action.targetPageIndex, 0, currentLayout.pageCount - 1)
        : normalizePageIndex(action.targetPageIndex, currentLayout.pageCount);

      if (
        hasReachedDragTarget(
          dragReleaseOrigin,
          action.targetVirtualIndex,
          action.dragReleaseEpsilon,
        )
      ) {
        return {
          ...syncedState,
          activePageIndex: nextTargetPageIndex,
          targetPageIndex: nextTargetPageIndex,
          fromVirtualIndex: action.targetVirtualIndex,
          virtualIndex: action.targetVirtualIndex,
          ...CLEARED_TRANSIENT_MOTION_STATE,
          animationMode: "none",
          moveReason: "gesture",
        };
      }

      return {
        ...syncedState,
        targetPageIndex: nextTargetPageIndex,
        fromVirtualIndex: dragReleaseOrigin,
        virtualIndex: action.targetVirtualIndex,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        animationMode: getDragReleaseAnimationMode(action),
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
        nextTargetPageIndex,
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
      const plannedTargetPageIndex =
        repeatedClickPlan?.nextTargetPageIndex ?? nextTargetPageIndex;
      const followUpVirtualIndex = repeatedClickPlan?.followUpVirtualIndex ?? null;
      const plannedVirtualIndex =
        repeatedClickPlan?.nextAdvanceVirtualIndex ?? nextVirtualIndex;

      if (
        repeatedClickPlan === null &&
        plannedTargetPageIndex === syncedState.targetPageIndex &&
        plannedVirtualIndex === syncedState.virtualIndex &&
        followUpVirtualIndex === null
      ) {
        if (action.moveReason === "gesture") {
          return {
            ...syncedState,
            fromVirtualIndex: nextFromVirtualIndex,
            ...CLEARED_TRANSIENT_MOTION_STATE,
            animationMode: "snap",
            moveReason: "gesture",
          };
        }
        return {
          ...syncedState,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: plannedVirtualIndex,
          ...CLEARED_TRANSIENT_MOTION_STATE,
          animationMode: action.isInstant
            ? "instant"
            : syncedState.animationMode,
          moveReason: action.moveReason,
        };
      }

      return {
        ...syncedState,
        targetPageIndex: plannedTargetPageIndex,
        fromVirtualIndex: nextFromVirtualIndex,
        virtualIndex: plannedVirtualIndex,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        followUpVirtualIndex,
        isRepeatedClickAdvance: repeatedClickPlan !== null,
        animationMode,
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
          animationMode: "normal",
          moveReason: "click",
        };
      }

      return {
        ...syncedState,
        activePageIndex: syncedState.targetPageIndex,
        fromVirtualIndex: syncedState.virtualIndex,
        ...CLEARED_TRANSIENT_MOTION_STATE,
        animationMode: "none",
      };
    }

    default:
      return syncedState;
  }
}
