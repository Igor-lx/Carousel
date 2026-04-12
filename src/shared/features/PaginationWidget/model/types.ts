import type { CSSProperties } from "react";

export type AnimationMode = "IDLE" | "WAITING" | "MOVING";

export interface PaginationState {
  step: number;
  mode: AnimationMode;
  lastDirection: "next" | "prev" | null;
}

export type PaginationAction =
  | { type: "CLICK"; direction: "next" | "prev" }
  | { type: "START_ANIMATION" }
  | { type: "END_STEP" };

export interface DotWidgetState {
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

export interface LayoutModel {
  geometry: GeometryData;
  scales: number[];
}

export interface SpatialConfig {
  size: number;
  gap: number;
  scaleFactor: number;
}

export interface ContainerCSSVars extends CSSProperties {
  "--duration": string;
  "--delay": string;
  "--visible-dots-count": string;
  "--dot-size": string;
  "--dots-gap": string;
}

export interface DotCSSVars extends CSSProperties {
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

export interface DotProps {
  state: DotWidgetState;
  className: PaginationWidgetClassMap;
}
