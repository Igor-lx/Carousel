import type { CSSProperties } from "react";

export type AnimationMode = "IDLE" | "WAITING" | "MOVING";

export interface PaginationState {
  readonly step: number;
  readonly mode: AnimationMode;
  readonly lastDirection: "next" | "prev" | null;
}

export type PaginationAction =
  | { type: "CLICK"; direction: "next" | "prev" }
  | { type: "START_ANIMATION" }
  | { type: "END_STEP" };

export interface PaginationWidgetClassMap {
  readonly container_PW?: string;
  readonly dot_PW?: string;
  readonly dotActive_PW?: string;
  readonly freezed?: string;
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

export interface DotWidgetState {
  readonly x: number;
  readonly scale: number;
  readonly opacity: number;
  readonly isActive: boolean;
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
  dotSize?: number;
  dotGap?: number;
  visibleDots?: number;
  isFreezed?: boolean;
  delay?: number;
  duration?: number;
  scaleFactor?: number;
}
