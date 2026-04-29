import type { CarouselLayout } from "../../utilities";
import type { AnimationMode, State } from "./types";

export const CLEARED_TRANSIENT_MOTION_STATE = {
  followUpVirtualIndex: null,
  isRepeatedClickAdvance: false,
  gesturePointerReleaseVelocity: 0,
  gestureUiReleaseVelocity: 0,
} as const;

export const initialState = (currentLayout: CarouselLayout): State => ({
  currentLayout,
  activePageIndex: 0,
  targetPageIndex: 0,
  fromVirtualIndex: 0,
  virtualIndex: 0,
  ...CLEARED_TRANSIENT_MOTION_STATE,
  animationMode: "none",
  moveReason: "unknown",
});

export const getAnimationStatus = (mode: AnimationMode) => ({
  isIdle: mode === "none",
  isMoving: mode !== "none",
  isJumping: mode === "jump",
  isInstant: mode === "instant",
  isSnap: mode === "snap",
  isAnimating: mode === "normal" || mode === "jump" || mode === "snap",
});
