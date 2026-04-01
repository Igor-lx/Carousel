import type { StepAction, CarouselLayout } from "../types";
import { getSafeIndexMap } from "./utilites_component";

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

export const getNextIndex = (
  action: StepAction,
  currentIndex: number,
  currentLayout: CarouselLayout,
): number => {
  const rawIndex =
    action.type === "MOVE"
      ? currentIndex + action.step * currentLayout.clampedVisible
      : action.target;

  if (currentLayout.isInfinite && action.isInstant) {
    return getSafeIndexMap(
      rawIndex,
      currentLayout.cloneCount,
      currentLayout.virtualLength,
    ).targetIndex;
  }
  const clampedIndex = clamp(
    rawIndex,
    currentLayout.minScrollIndex,
    currentLayout.maxScrollIndex,
  );

  return clampedIndex;
};

export const getReconciledIndex = (
  currentIndex: number,
  prevLayout: CarouselLayout,
  nextLayout: CarouselLayout,
): number => {
  if (!prevLayout.virtualLength || !nextLayout.virtualLength) {
    return nextLayout.cloneCount;
  }
  const { normalizedIndex } = getSafeIndexMap(
    currentIndex,
    prevLayout.cloneCount,
    prevLayout.virtualLength,
  );

  const oldMaxScroll = Math.max(
    0,
    prevLayout.virtualLength - prevLayout.clampedVisible,
  );
  const scrollProgress = oldMaxScroll <= 0 ? 0 : normalizedIndex / oldMaxScroll;

  const nextMaxScroll = Math.max(
    0,
    nextLayout.virtualLength - nextLayout.clampedVisible,
  );
  const rawTarget = scrollProgress * nextMaxScroll;

  const page = Math.round(rawTarget / nextLayout.clampedVisible);
  const targetIndex = nextLayout.cloneCount + page * nextLayout.clampedVisible;

  const clampedIndex = clamp(
    targetIndex,
    nextLayout.minScrollIndex,
    nextLayout.maxScrollIndex,
  );

  return clampedIndex;
};
