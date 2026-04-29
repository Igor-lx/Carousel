import {
  getPageStart,
  getReconciledPageIndex,
  type CarouselLayout,
} from "../../../utilities";
import type { State } from "../types";
import { CLEARED_TRANSIENT_MOTION_STATE, initialState } from "../state";

const hasSameLayout = (
  prevLayout: CarouselLayout,
  nextLayout: CarouselLayout,
) =>
  prevLayout.dataKey === nextLayout.dataKey &&
  prevLayout.totalVirtual === nextLayout.totalVirtual &&
  prevLayout.visibleSlidesCount === nextLayout.visibleSlidesCount &&
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

  const nextActivePageIndex = getReconciledPageIndex(
    state.activePageIndex,
    currentLayout,
    nextLayout,
  );

  const nextTargetPageIndex = getReconciledPageIndex(
    state.targetPageIndex,
    currentLayout,
    nextLayout,
  );

  const nextVirtualIndex = getPageStart(
    nextTargetPageIndex,
    nextLayout.visibleSlidesCount,
  );

  return {
    ...state,
    currentLayout: nextLayout,
    activePageIndex: nextActivePageIndex,
    targetPageIndex: nextTargetPageIndex,
    fromVirtualIndex: nextVirtualIndex,
    virtualIndex: nextVirtualIndex,
    ...CLEARED_TRANSIENT_MOTION_STATE,
    animationMode: "instant",
  };
};
