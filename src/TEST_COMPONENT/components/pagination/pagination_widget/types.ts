import type { CSSProperties } from "react";

export type AnimationMode = "none" | "waiting" | "moving";

export interface PaginationState {
  readonly step: number;
  readonly animMode: AnimationMode;
  readonly activeDelay: number;
  readonly activeDuration: number;
}

export type PaginationAction =
  | { type: "CLICK"; direction: "next" | "prev"; configDelay: number; configDuration: number }
  | { type: "START_ANIMATION"; direction: "next" | "prev" }
  | { type: "END_STEP" };

export interface PaginationWidgetClassMap {
  readonly container_PW?: string;
  readonly dot_PW?: string;
  readonly dotActive_PW?: string;
  readonly freezed?: string;
}

export interface DotWidgetState {
  readonly id: number;
  readonly x: number;
  readonly scale: number;
  readonly opacity: number;
  readonly isActive: boolean;
}


export interface ContainerCSSVars extends CSSProperties {
  "--duration"?: string;
  "--delay"?: string;
  "--visible-dots-count"?: number;
}

export interface DotCSSVars extends CSSProperties {
  "--dot-x": string;
  "--dot-scale": number;
  "--dot-opacity": number;
}

export interface SpatialConfig {
  readonly size: number;
  readonly gap: number;
  readonly scaleFactor: number;
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