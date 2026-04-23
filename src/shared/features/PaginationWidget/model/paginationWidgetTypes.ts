import type { CSSProperties } from "react";

export type PaginationWidgetAnimationMode = "IDLE" | "WAITING" | "MOVING";

export interface PaginationWidgetState {
  step: number;
  requestId: number;
  mode: PaginationWidgetAnimationMode;
  lastDirection: "next" | "prev" | null;
}

export type PaginationWidgetAction =
  | { type: "CLICK"; direction: "next" | "prev" }
  | { type: "START_ANIMATION" }
  | { type: "END_STEP" }
  | { type: "RESET" };

export interface PaginationWidgetDotState {
  id: number;
  x: number;
  scale: number;
  opacity: number;
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
  "--delay": string;
  "--visible-dots-count": string;
  "--dot-size": string;
  "--dots-gap": string;
}

export interface PaginationWidgetDotCSSVars extends CSSProperties {
  "--dot-x": string;
  "--dot-scale": number;
  "--dot-opacity": number;
}

export interface PaginationWidgetHandler {
  moveRight: () => void;
  moveLeft: () => void;
  toggleFreezed: (isFreezed: boolean) => void;
  setDuration: (val: number | null) => void;
}

export type PaginationWidgetClassMap = {
  [key: string]: string | undefined;
  container_PW?: string;
  dot_PW?: string;
  dotActive_PW?: string;
  freezed?: string;
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
