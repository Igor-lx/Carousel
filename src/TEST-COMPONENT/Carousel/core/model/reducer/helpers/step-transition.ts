import {
  clamp,
  getAlignedVirtualIndex,
  getPageStart,
  getShortestCyclicDistance,
  normalizePageIndex,
} from "../../../utilities";
import type { AnimationMode, State, StepAction } from "../types";

const getStepAnimationMode = (
  action: StepAction,
): Extract<AnimationMode, "instant" | "normal" | "jump"> =>
  action.isInstant ? "instant" : action.type === "GO_TO" ? "jump" : "normal";

const getTransitionSource = (state: State, fromVirtualIndex: number) => {
  const { currentLayout } = state;
  const stepSize = currentLayout.clampedVisible;
  const isQueuedMotion = currentLayout.canSlide && state.animMode !== "none";
  const hasPendingTarget =
    currentLayout.canSlide && state.targetIndex !== state.activeIndex;
  const currentLogicalIndex = hasPendingTarget
    ? state.targetIndex
    : state.activeIndex;
  const laneReference = isQueuedMotion ? state.virtualIndex : fromVirtualIndex;
  const currentPhysicalIndex = currentLayout.isFinite
    ? getPageStart(currentLogicalIndex, stepSize)
    : getAlignedVirtualIndex(currentLogicalIndex, laneReference, currentLayout);

  return {
    currentLogicalIndex,
    currentPhysicalIndex,
  };
};

export const resolveStepTransition = (state: State, action: StepAction) => {
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
      : getShortestCyclicDistance(
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
    animationMode: getStepAnimationMode(action),
  };
};
