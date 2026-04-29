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
  const stepSize = currentLayout.visibleSlidesCount;
  const isQueuedMotion =
    currentLayout.canSlide && state.animationMode !== "none";
  const hasPendingTarget =
    currentLayout.canSlide &&
    state.targetPageIndex !== state.activePageIndex;
  const currentPageIndex = hasPendingTarget
    ? state.targetPageIndex
    : state.activePageIndex;
  const laneReference = isQueuedMotion ? state.virtualIndex : fromVirtualIndex;
  const currentVirtualIndex = currentLayout.isFinite
    ? getPageStart(currentPageIndex, stepSize)
    : getAlignedVirtualIndex(currentPageIndex, laneReference, currentLayout);

  return {
    currentPageIndex,
    currentVirtualIndex,
  };
};

export const resolveStepTransition = (state: State, action: StepAction) => {
  const { currentLayout } = state;
  const stepSize = currentLayout.visibleSlidesCount;
  const nextFromVirtualIndex = action.fromVirtualIndex ?? state.virtualIndex;
  const { currentPageIndex, currentVirtualIndex } = getTransitionSource(
    state,
    nextFromVirtualIndex,
  );

  let nextTargetPageIndex = currentPageIndex;
  let pageDelta = 0;

  if (action.type === "MOVE") {
    const rawTargetPageIndex = currentPageIndex + action.step;

    nextTargetPageIndex = currentLayout.isFinite
      ? clamp(rawTargetPageIndex, 0, currentLayout.pageCount - 1)
      : normalizePageIndex(rawTargetPageIndex, currentLayout.pageCount);

    pageDelta = currentLayout.isFinite
      ? nextTargetPageIndex - currentPageIndex
      : action.step;
  } else {
    const resolvedTargetPageIndex = currentLayout.isFinite
      ? clamp(action.targetPageIndex, 0, currentLayout.pageCount - 1)
      : normalizePageIndex(action.targetPageIndex, currentLayout.pageCount);

    pageDelta = currentLayout.isFinite
      ? resolvedTargetPageIndex - currentPageIndex
      : getShortestCyclicDistance(
          currentPageIndex,
          resolvedTargetPageIndex,
          currentLayout.pageCount,
        );

    nextTargetPageIndex = currentLayout.isFinite
      ? resolvedTargetPageIndex
      : normalizePageIndex(
          currentPageIndex + pageDelta,
          currentLayout.pageCount,
        );
  }

  const nextVirtualIndex = currentLayout.isFinite
    ? getPageStart(nextTargetPageIndex, stepSize)
    : currentVirtualIndex + pageDelta * stepSize;

  return {
    nextFromVirtualIndex,
    nextTargetPageIndex,
    nextVirtualIndex,
    animationMode: getStepAnimationMode(action),
  };
};
