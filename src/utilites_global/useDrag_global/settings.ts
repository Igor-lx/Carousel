import { type CSSProperties } from "react";

export const DRAG_CONFIG = {
  INTENT_THRESHOLD: 5,
  SWIPE_THRESHOLD_RATIO: 0.15,
  MIN_SWIPE_DISTANCE: 20,
  RESISTANCE_LIMIT: 0,
  RESISTANCE_FACTOR: 10,
  MAX_OVERDRAG_RATIO: 0.25,
  MAX_VELOCITY: 4,
  VELOCITY_EMA_ALPHA: 0.8,
} as const;

export const STATIC_DRAG_STYLE: CSSProperties = {
  touchAction: "pan-y",
  userSelect: "none",
  WebkitUserSelect: "none",
};

export const EMPTY_STYLE: CSSProperties = {};
