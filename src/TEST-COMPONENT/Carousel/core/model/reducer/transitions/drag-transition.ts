import type { AnimationMode, EndDragReducerAction } from "../types";

export const hasReachedDragTarget = (
  dragReleaseOrigin: number,
  targetVirtualIndex: number,
  dragReleaseEpsilon: number,
) => Math.abs(dragReleaseOrigin - targetVirtualIndex) < dragReleaseEpsilon;

export const getDragReleaseAnimationMode = (
  action: EndDragReducerAction,
): AnimationMode => {
  if (action.isInstant) return "instant";
  return action.isSnap ? "snap" : "normal";
};
