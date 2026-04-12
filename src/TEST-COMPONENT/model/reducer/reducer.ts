import type { Action, AnimationMode, State, StepAction } from ".";
import {
  getAlignedVirtualIndex,
  clamp,
  getPageStart,
  getReconciledPageIndex,
  getShortestDistance,
  normalizePageIndex,
  type CarouselLayout,
} from "../../utilites";

export const initialState = (currentLayout: CarouselLayout): State => ({
  currentLayout,
  activeIndex: 0,
  targetIndex: 0,
  virtualIndex: 0,
  fromVirtualIndex: 0,
  animMode: "none",
  moveReason: "unknown",
  pendingTransition: null,
});

export const getAnimStatus = (mode: AnimationMode) => ({
  isIdle: mode === "none",
  isMoving: mode !== "none",
  isJumping: mode === "jump",
  isInstant: mode === "instant",
  isSnap: mode === "snap",
  isAnimating: mode === "normal" || mode === "jump" || mode === "snap",
});

const getStepAnimationMode = (
  action: StepAction,
): "instant" | "normal" | "jump" =>
  action.isInstant
    ? "instant"
    : action.type === "GO_TO"
      ? "jump"
      : "normal";

const getTransitionSource = (state: State, fromVirtualIndex: number) => {
  const { currentLayout } = state;
  const stepSize = currentLayout.clampedVisible;
  const isQueuedMotion = currentLayout.canSlide && state.animMode !== "none";
  const hasPendingTarget =
    currentLayout.canSlide && state.targetIndex !== state.activeIndex;
  const currentLogicalIndex =
    hasPendingTarget ? state.targetIndex : state.activeIndex;
  const laneReference = isQueuedMotion ? state.virtualIndex : fromVirtualIndex;
  const currentPhysicalIndex = currentLayout.isInfinite
    ? getAlignedVirtualIndex(
        currentLogicalIndex,
        laneReference,
        currentLayout,
      )
    : getPageStart(currentLogicalIndex, stepSize);

  return {
    currentLogicalIndex,
    currentPhysicalIndex,
  };
};

const resolveStepAction = (state: State, action: StepAction) => {
  const { currentLayout } = state;
  const stepSize = currentLayout.clampedVisible;
  const nextFromVirtualIndex = action.fromVirtualIndex ?? state.virtualIndex;
  const { currentLogicalIndex, currentPhysicalIndex } = getTransitionSource(
    state,
    nextFromVirtualIndex,
  );

  let nextTargetIndex = currentLogicalIndex;
  let logicalDelta = 0;

  if (action.type === "MOVE") {
    const rawTargetIndex = currentLogicalIndex + action.step;

    nextTargetIndex = currentLayout.isInfinite
      ? normalizePageIndex(rawTargetIndex, currentLayout.pageCount)
      : clamp(rawTargetIndex, 0, currentLayout.pageCount - 1);

    logicalDelta = currentLayout.isInfinite
      ? action.step
      : nextTargetIndex - currentLogicalIndex;
  } else {
    const clampedTarget = currentLayout.isInfinite
      ? normalizePageIndex(action.target, currentLayout.pageCount)
      : clamp(action.target, 0, currentLayout.pageCount - 1);

    logicalDelta = currentLayout.isInfinite
      ? getShortestDistance(
          currentLogicalIndex,
          clampedTarget,
          currentLayout.pageCount,
        )
      : clampedTarget - currentLogicalIndex;

    nextTargetIndex = currentLayout.isInfinite
      ? normalizePageIndex(currentLogicalIndex + logicalDelta, currentLayout.pageCount)
      : clampedTarget;
  }

  const nextVirtualIndex = currentLayout.isInfinite
    ? currentPhysicalIndex + logicalDelta * stepSize
    : getPageStart(nextTargetIndex, stepSize);

  return {
    nextFromVirtualIndex,
    nextTargetIndex,
    nextVirtualIndex,
  };
};

export function reducer(state: State, action: Action): State {
  const { currentLayout, animMode } = state;
  const status = getAnimStatus(animMode);
  const stepSize = currentLayout.clampedVisible;

  switch (action.type) {
    case "START_DRAG":
      return {
        ...state,
        fromVirtualIndex: action.fromVirtualIndex ?? state.virtualIndex,
        virtualIndex: action.fromVirtualIndex ?? state.virtualIndex,
        animMode: "none",
        pendingTransition: null,
      };

    case "END_DRAG_SNAP":
      const snapOrigin = action.fromVirtualIndex ?? state.virtualIndex;
      const snapTarget = currentLayout.isInfinite
        ? getAlignedVirtualIndex(state.targetIndex, snapOrigin, currentLayout)
        : getPageStart(state.targetIndex, stepSize);

      if (Math.abs(snapOrigin - snapTarget) < 0.001) {
        return {
          ...state,
          fromVirtualIndex: snapTarget,
          virtualIndex: snapTarget,
          animMode: "none",
          moveReason: "gesture",
          pendingTransition: null,
        };
      }

      return {
        ...state,
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
      } = resolveStepAction(state, action);
      const mode = getStepAnimationMode(action);
      const shouldRebase =
        status.isAnimating &&
        mode !== "instant" &&
        Math.abs(nextFromVirtualIndex - state.virtualIndex) > 0.001;

      if (shouldRebase) {
        const pendingAnimMode = action.type === "GO_TO" ? "jump" : "normal";

        return {
          ...state,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: nextFromVirtualIndex,
          animMode: "rebase",
          moveReason: action.moveReason,
          pendingTransition: {
            targetIndex: nextTargetIndex,
            virtualIndex: nextVirtualIndex,
            animMode: pendingAnimMode,
            moveReason: action.moveReason,
          },
        };
      }

      if (nextTargetIndex === state.targetIndex && nextVirtualIndex === state.virtualIndex) {
        if (action.moveReason === "gesture") {
          return {
            ...state,
            fromVirtualIndex: nextFromVirtualIndex,
            animMode: "snap",
            moveReason: "gesture",
            pendingTransition: null,
          };
        }
        return {
          ...state,
          fromVirtualIndex: nextFromVirtualIndex,
          virtualIndex: nextVirtualIndex,
          animMode: action.isInstant ? "instant" : state.animMode,
          moveReason: action.moveReason,
          pendingTransition: null,
        };
      }

      return {
        ...state,
        targetIndex: nextTargetIndex,
        fromVirtualIndex: nextFromVirtualIndex,
        virtualIndex: nextVirtualIndex,
        animMode: mode,
        moveReason: action.moveReason,
        pendingTransition: null,
      };
    }

    case "COMMIT_REBASE": {
      if (!state.pendingTransition) return state;

      return {
        ...state,
        targetIndex: state.pendingTransition.targetIndex,
        virtualIndex: state.pendingTransition.virtualIndex,
        animMode: state.pendingTransition.animMode,
        moveReason: state.pendingTransition.moveReason,
        pendingTransition: null,
      };
    }

    case "END_STEP": {
      if (status.isIdle) return state;

      return {
        ...state,
        activeIndex: state.targetIndex,
        fromVirtualIndex: state.virtualIndex,
        animMode: "none",
        pendingTransition: null,
      };
    }

    case "RECONCILE": {
      const { nextLayout } = action;
      const isSame =
        nextLayout.dataKey === currentLayout.dataKey &&
        nextLayout.totalVirtual === currentLayout.totalVirtual &&
        nextLayout.clampedVisible === currentLayout.clampedVisible &&
        nextLayout.isInfinite === currentLayout.isInfinite &&
        nextLayout.pageCount === currentLayout.pageCount;

      if (isSame) return state;

      const isHardReset =
        nextLayout.dataKey !== currentLayout.dataKey ||
        nextLayout.isInfinite !== currentLayout.isInfinite;

      if (isHardReset) return initialState(nextLayout);

      const nextActiveIndex = getReconciledPageIndex(
        state.activeIndex,
        currentLayout,
        nextLayout,
      );

      const nextTargetIndex = getReconciledPageIndex(
        state.targetIndex,
        currentLayout,
        nextLayout,
      );

      const nextVirtualIndex = getPageStart(
        nextTargetIndex,
        nextLayout.clampedVisible,
      );

      return {
        ...state,
        currentLayout: nextLayout,
        activeIndex: nextActiveIndex,
        targetIndex: nextTargetIndex,
        fromVirtualIndex: nextVirtualIndex,
        virtualIndex: nextVirtualIndex,
        animMode: "instant",
        pendingTransition: null,
      };
    }

    default:
      return state;
  }
}
