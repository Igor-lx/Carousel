import type { CSSProperties } from "react";
import type { DragConfig } from "./types";

export const DEFAULT_DRAG_CONFIG: Required<DragConfig> = {
  COOLDOWN_MS: 150,
  INTENT_THRESHOLD: 8,
  RESISTANCE: 0.7,
  RESISTANCE_CURVATURE: 0.002,
  MAX_VELOCITY: 5,
  EMA_ALPHA: 0.7,
  SWIPE_VELOCITY_LIMIT: 0.5,
  QUICK_SWIPE_MIN_OFFSET: 10,
  MIN_SWIPE_DISTANCE: 20,
  SWIPE_THRESHOLD_RATIO: 0.2,
} as const;

export const SHARED_DRAG_STYLES: CSSProperties = {
  touchAction: "pan-y",
  userSelect: "none",
  WebkitUserSelect: "none",
  overscrollBehaviorX: "contain",
  WebkitTapHighlightColor: "transparent",
};
