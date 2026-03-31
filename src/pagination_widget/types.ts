import type { CSSProperties } from "react";

export type AnimationMode = "none" | "waiting" | "moving";

export interface PaginationState {
  step: number;
  animMode: AnimationMode;
  activeDelay: number;
  activeDuration: number;
}

export type PaginationAction =
  | {
      type: "CLICK";
      direction: "next" | "prev";
      configDelay: number;
      configDuration: number;
    }
  | { type: "START_ANIMATION"; direction: "next" | "prev" }
  | { type: "END_STEP" };

export interface PaginationWidgetClassMap {
  readonly container_PW?: string;
  readonly dot_PW?: string;
  readonly dotActive_PW?: string;
  readonly freezed?: string;
}

export interface DotWidgetState {
  id: number;
  x: number;
  scale: number;
  opacity: number;
  isActive: boolean;
}

export interface ContainerWidgetStyle extends CSSProperties {
  "--duration"?: string;
  "--delay"?: string;
}

export interface DotWidgetStyle extends CSSProperties {
  "--dot-x": string;
  "--dot-scale": number;
  "--dot-opacity": number;
}

export interface SpatialConfig {
  size: number;
  gap: number;
  scaleFactor: number;
}

export interface PaginationWidgetHandler {
  moveRight: () => void;
  moveLeft: () => void;
}

export interface PaginationWidgetProps {
  className: PaginationWidgetClassMap;
  visibleDots?: number;
  isFreezed?: boolean;
  delay?: number;
  duration?: number;
  scaleFactor?: number;
}

export interface PaginationWidgetDotProps {
  state: DotWidgetState;
  className: PaginationWidgetClassMap;
}
