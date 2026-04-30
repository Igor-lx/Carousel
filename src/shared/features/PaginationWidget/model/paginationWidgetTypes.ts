import type { CSSProperties } from "react";
import type { NumericMotionValueSource } from "../../../motion";

export type PaginationWidgetAnimationMode = "IDLE" | "WAITING" | "MOVING";
export type PaginationWidgetMoveDirection = "right" | "left";

export interface PaginationWidgetState {
  visualOffset: number;
  requestId: number;
  mode: PaginationWidgetAnimationMode;
  direction: PaginationWidgetMoveDirection | null;
}

export type PaginationWidgetAction =
  | { type: "REQUEST_MOVE"; direction: PaginationWidgetMoveDirection }
  | { type: "BEGIN_MOVE" }
  | { type: "COMPLETE_MOVE" }
  | { type: "STOP" };

export interface PaginationWidgetDotState {
  id: number;
  x: number;
  scale: number;
  opacity: number;
  activeStrength: number;
  isActive: boolean;
}

interface GeometryData {
  strip: number[];
  actualCount: number;
  centerIndex: number;
  unit: number;
}

export interface PaginationWidgetLayoutModel {
  geometry: GeometryData;
  scales: number[];
}

export interface PaginationWidgetSpatialConfig {
  size: number;
  gap: number;
  scaleFactor: number;
}

export interface PaginationWidgetContainerCSSVars extends CSSProperties {
  "--duration": string;
  "--visible-dots-count": string;
  "--dot-size": string;
  "--dots-gap": string;
}

export interface PaginationWidgetDotCSSVars extends CSSProperties {
  "--dot-x": string;
  "--dot-scale": number;
  "--dot-opacity": number;
  "--dot-active-strength": number;
}

export interface PaginationWidgetHandler {
  moveRight: () => void;
  moveLeft: () => void;
  setStopped: (isStopped: boolean) => void;
  setDuration: (val: number | null) => void;
  bindMotionSource: (source: NumericMotionValueSource | null) => void;
}

export type PaginationWidgetClassMap = {
  [key: string]: string | undefined;
  container_PW?: string;
  dot_PW?: string;
  dotActive_PW?: string;
  stopped?: string;
};

export interface PaginationWidgetProps {
  className?: PaginationWidgetClassMap;
  dotSize?: number;
  dotGap?: number;
  visibleDots?: number;
  delay?: number;
  duration?: number;
  scaleFactor?: number;
}

export interface PaginationWidgetDotProps {
  state: PaginationWidgetDotState;
  className: PaginationWidgetClassMap;
}
