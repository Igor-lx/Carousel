import type { AnimationMode, State, StepAction } from ".";
import type { CarouselRepeatedClickSettings } from "../diagnostic";
import {
  clamp,
  getAlignedVirtualIndex,
  getPageStart,
  getReconciledPageIndex,
  getShortestDistance,
  normalizePageIndex,
  type CarouselLayout,
} from "../../utilities";

export const initialState = (currentLayout: CarouselLayout): State => ({
  currentLayout,
  activeIndex: 0,
  targetIndex: 0,
  fromVirtualIndex: 0,
  virtualIndex: 0,
  followUpVirtualIndex: null,
  isRepeatedClickAdvance: false,
  animMode: "none",
  moveReason: "unknown",
  gestureReleaseVelocity: 0,
});

export const getAnimStatus = (mode: AnimationMode) => ({
  isIdle: mode === "none",
  isMoving: mode !== "none",
  isJumping: mode === "jump",
  isInstant: mode === "instant",
  isSnap: mode === "snap",
  isAnimating: mode === "normal" || mode === "jump" || mode === "snap",
});

const hasSameLayout = (
  prevLayout: CarouselLayout,
  nextLayout: CarouselLayout,
) =>
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
    followUpVirtualIndex: null,
    isRepeatedClickAdvance: false,
    animMode: "instant",
    gestureReleaseVelocity: 0,
  };
};

const getStepAnimationMode = (
  action: StepAction,
): "instant" | "normal" | "jump" =>
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

const clampRepeatedClickVirtualIndex = (
  virtualIndex: number,
  layout: CarouselLayout,
) => {
  if (!layout.isFinite) {
    return virtualIndex;
  }

  const minVirtualIndex = 0;
  const maxVirtualIndex = getPageStart(
    layout.pageCount - 1,
    layout.clampedVisible,
  );

  return clamp(virtualIndex, minVirtualIndex, maxVirtualIndex);
};

export const resolveRepeatedClickPlan = ({
  state,
  fromVirtualIndex,
  step,
  repeatedClickSettings,
}: {
  state: State;
  fromVirtualIndex: number;
  step: number;
  repeatedClickSettings: CarouselRepeatedClickSettings;
}) => {
  const { currentLayout: layout } = state;
  const direction = Math.sign(step);
  const stepSize = layout.clampedVisible;
  const epsilon = repeatedClickSettings.epsilon;

  if (direction === 0 || stepSize <= epsilon) {
    return null;
  }

  const currentDirection = Math.sign(state.virtualIndex - state.fromVirtualIndex);
  const isRepeatedSameDirectionClick =
    state.animMode !== "none" &&
    currentDirection !== 0 &&
    currentDirection === direction;

  if (!isRepeatedSameDirectionClick) {
    return null;
  }

  const { destinationPosition } = repeatedClickSettings;
  const currentPageOrigin =
    direction > 0
      ? Math.floor(fromVirtualIndex / stepSize) * stepSize
      : Math.ceil(fromVirtualIndex / stepSize) * stepSize;

  const nextAdvanceVirtualIndex = clampRepeatedClickVirtualIndex(
    currentPageOrigin + direction * (1 + destinationPosition) * stepSize,
    layout,
  );

  const nextTargetVirtualIndex = clampRepeatedClickVirtualIndex(
    currentPageOrigin + direction * 2 * stepSize,
    layout,
  );

  const targetPageIndex = Math.round(nextTargetVirtualIndex / stepSize);
  const nextTargetIndex = layout.isFinite
    ? clamp(targetPageIndex, 0, layout.pageCount - 1)
    : normalizePageIndex(targetPageIndex, layout.pageCount);
  const followUpVirtualIndex =
    Math.abs(nextTargetVirtualIndex - nextAdvanceVirtualIndex) >= epsilon
      ? nextTargetVirtualIndex
      : null;

  return {
    nextTargetIndex,
    nextAdvanceVirtualIndex,
    followUpVirtualIndex,
  };
};
