import type { CarouselLayout, State, AnimationMode, Action } from "./types";
import { getNextIndex, getReconciledIndex, getSafeIndexMap } from "./utilites";

export const initialState = (currentLayout: CarouselLayout): State => ({
  currentLayout,
  currentIndex: currentLayout.cloneCount,
  prevIndex: null,
  animMode: "none",
  pendingAction: null,
  moveReason: "unknown",
});

export const getAnimStatus = (mode: AnimationMode) => ({
  isIdle: mode === "none",
  isMoving: mode !== "none",
  isJumping: mode === "jump",
  isInstant: mode === "instant",
  isSnap: mode === "snap",
  isAnimating: mode === "normal" || mode === "jump" || mode === "snap",
});

export function reducer(state: State, action: Action): State {
  const { currentLayout, currentIndex, animMode } = state;

  const status = getAnimStatus(animMode);

  switch (action.type) {
    case "START_DRAG":
      return { ...state, animMode: "none" };

    case "END_DRAG_SNAP":
      return { ...state, animMode: "snap", moveReason: "gesture" };

    case "MOVE":
    case "GO_TO": {
      if (status.isAnimating) {
        if (action.type === "MOVE") {
          return { ...state, pendingAction: action };
        }

        if (action.type === "GO_TO" && status.isJumping) {
          return { ...state, pendingAction: action };
        }
      }

      const nextIndex = getNextIndex(action, currentIndex, currentLayout);

      if (nextIndex === currentIndex && !action.isInstant) return state;

      const mode: AnimationMode = action.isInstant
        ? "instant"
        : action.type === "GO_TO"
          ? "jump"
          : "normal";

      return {
        ...state,
        currentIndex: nextIndex,
        prevIndex: currentIndex,
        animMode: mode,
        pendingAction: null,
        moveReason: action.moveReason,
      };
    }

    case "END_STEP": {
      if (status.isIdle) return state;

      if (!currentLayout.isInfinite) {
        return { ...state, prevIndex: null, animMode: "none" };
      }

      const { targetIndex, shouldJump } = getSafeIndexMap(
        currentIndex,
        currentLayout.cloneCount,
        currentLayout.virtualLength,
      );

      return {
        ...state,
        currentIndex: targetIndex,
        prevIndex: null,
        animMode: shouldJump ? "instant" : "none",
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

      return {
        ...state,
        currentLayout: nextLayout,
        currentIndex: getReconciledIndex(
          currentIndex,
          currentLayout,
          nextLayout,
        ),
        prevIndex: currentIndex,
        animMode: "instant",
        pendingAction: null,
      };
    }

    case "CLEAR_PENDING":
      return { ...state, pendingAction: null };

    default:
      return state;
  }
}
