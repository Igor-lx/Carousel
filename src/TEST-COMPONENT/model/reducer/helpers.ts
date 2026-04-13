import type { AnimationMode, State, StepAction } from ".";
import {
  clamp,
  getAlignedVirtualIndex,
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

const hasSameLayout = (prevLayout: CarouselLayout, nextLayout: CarouselLayout) =>
  prevLayout.dataKey === nextLayout.dataKey &&
  prevLayout.totalVirtual === nextLayout.totalVirtual &&
  prevLayout.clampedVisible === nextLayout.clampedVisible &&
  prevLayout.isFinite === nextLayout.isFinite &&
  prevLayout.pageCount === nextLayout.pageCount;

export const reconcileStateToLayout = (
  state: State,
  nextLayout: CarouselLayout,
): State => {
  const currentLayout = state.currentLayout;

  if (hasSameLayout(currentLayout, nextLayout)) {
    return currentLayout === nextLayout
      ? state
      : {
          ...state,
          currentLayout: nextLayout,
        };
  }

  const isHardReset =
    nextLayout.dataKey !== currentLayout.dataKey ||
    nextLayout.isFinite !== currentLayout.isFinite;

  if (isHardReset) {
    return initialState(nextLayout);
  }

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
};

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
  const currentPhysicalIndex = currentLayout.isFinite
    ? getPageStart(currentLogicalIndex, stepSize)
    : getAlignedVirtualIndex(
        currentLogicalIndex,
        laneReference,
        currentLayout,
      );

  return {
    currentLogicalIndex,
    currentPhysicalIndex,
  };
};

export const resolveStepAction = (state: State, action: StepAction) => {
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

    nextTargetIndex = currentLayout.isFinite
      ? clamp(rawTargetIndex, 0, currentLayout.pageCount - 1)
      : normalizePageIndex(rawTargetIndex, currentLayout.pageCount);

    logicalDelta = currentLayout.isFinite
      ? nextTargetIndex - currentLogicalIndex
      : action.step;
  } else {
    const clampedTarget = currentLayout.isFinite
      ? clamp(action.target, 0, currentLayout.pageCount - 1)
      : normalizePageIndex(action.target, currentLayout.pageCount);

    logicalDelta = currentLayout.isFinite
      ? clampedTarget - currentLogicalIndex
      : getShortestDistance(
          currentLogicalIndex,
          clampedTarget,
          currentLayout.pageCount,
        );

    nextTargetIndex = currentLayout.isFinite
      ? clampedTarget
      : normalizePageIndex(
          currentLogicalIndex + logicalDelta,
          currentLayout.pageCount,
        );
  }

  const nextVirtualIndex = currentLayout.isFinite
    ? getPageStart(nextTargetIndex, stepSize)
    : currentPhysicalIndex + logicalDelta * stepSize;

  return {
    nextFromVirtualIndex,
    nextTargetIndex,
    nextVirtualIndex,
    mode: getStepAnimationMode(action),
  };
};
