import  { DRAG_CONFIG } from "./settings";
import type { DragGestureResult } from "./types";


export const applyPhysics = (offset: number, width: number): number => {
  if (width <= 0) return offset;
  const { RESISTANCE_LIMIT, RESISTANCE_FACTOR, MAX_OVERDRAG_RATIO } =
    DRAG_CONFIG;

  const absOffset = Math.abs(offset);
  if (absOffset <= RESISTANCE_LIMIT) return offset;

  const sign = offset > 0 ? 1 : -1;
  const overdrag = absOffset - RESISTANCE_LIMIT;
  const resisted = RESISTANCE_LIMIT + Math.sqrt(overdrag) * RESISTANCE_FACTOR;
  const maxAllowed = RESISTANCE_LIMIT + width * MAX_OVERDRAG_RATIO;

  return Math.min(resisted, maxAllowed) * sign;
};

export const calculateVelocity = (
  currentVelocity: number,
  dx: number,
  dt: number,
): number => {
  if (dt <= 0) return currentVelocity;
  const instantV = Math.abs(dx / dt);
  const alpha = DRAG_CONFIG.VELOCITY_EMA_ALPHA;

  const nextV = currentVelocity * (1 - alpha) + instantV * alpha;
  return Math.min(nextV, DRAG_CONFIG.MAX_VELOCITY);
};

export const detectSwipeResult = (
  offset: number,
  velocity: number,
  width: number,
): DragGestureResult => {
  const threshold = Math.max(
    DRAG_CONFIG.MIN_SWIPE_DISTANCE,
    width * DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
  );

  const isQuickFlick = velocity > 0.5 && Math.abs(offset) > 10;

  if (Math.abs(offset) > threshold || isQuickFlick) {
    return offset < 0 ? "SWIPED_LEFT" : "SWIPED_RIGHT";
  }

  return "NONE";
};
