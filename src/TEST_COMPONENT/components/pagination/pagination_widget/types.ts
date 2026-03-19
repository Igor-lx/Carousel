import type { CSSProperties } from "react";

export type PaginationWidgetClassMap = {
  readonly paginationWidgetContainer?: string;
  readonly dotPaginationWidget?: string;
  readonly dotPaginationWidgetActive?: string;
  readonly paginationWidgetFreezed?: string;
};

export interface DotWidgetState {
  id: number;
  x: number;
  scale: number;
  opacity: number;
  isActive: boolean;
}

export type DotWidgetStyle = CSSProperties & {
  "--dot-x": string;
  "--dot-scale": number;
  "--dot-opacity": number;
};

export interface PaginationWidgetConfig {
  size: number;
  gap: number;
}

export interface PaginationWidgetHandler {
  moveRight: () => void;
  moveLeft: () => void;
}

export interface PaginationWidgetProps {
  className: PaginationWidgetClassMap;
  visibleDots?: number;
  dotSize?: number;
  gap?: number;
  isFreezed?: boolean;
}

export type PaginationWidgetDotProps = {
  state: DotWidgetState;
  className: PaginationWidgetClassMap;
};
