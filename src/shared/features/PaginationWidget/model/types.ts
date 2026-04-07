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

export interface DotWidgetState {
  readonly id: number;
  readonly x: number;
  readonly scale: number;
  readonly opacity: number;
  readonly isActive: boolean;
}

export interface GeometryData {
  readonly strip: number[];
  readonly actualCount: number;
  readonly centerIndex: number;
  readonly unit: number;
}

export interface LayoutModel {
  readonly geometry: GeometryData;
  readonly scales: number[];
}

export interface SpatialConfig {
  readonly size: number;
  readonly gap: number;
  readonly scaleFactor: number;
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
