import { type CSSProperties } from "react";

export const DRAG_CONFIG = {
  INTENT_THRESHOLD: 5,
  SWIPE_THRESHOLD_RATIO: 0.25,
  MIN_SWIPE_DISTANCE: 30,
  RESISTANCE_LIMIT: 100,
  RESISTANCE_FACTOR: 20,
  MAX_OVERDRAG_RATIO: 0.35,
  MAX_VELOCITY: 4,
  VELOCITY_EMA_ALPHA: 0.85,
} as const;

export const STATIC_DRAG_STYLE: CSSProperties = {
  touchAction: "pan-y",
  userSelect: "none",
  WebkitUserSelect: "none",
};

export const EMPTY_STYLE: CSSProperties = {};
