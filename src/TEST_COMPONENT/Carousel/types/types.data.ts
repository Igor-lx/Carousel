export interface CarouselLayout {
  length: number;
  clampedVisible: number;
  cloneCount: number;
  virtualLength: number;
  totalVirtual: number;
  pageCount: number;
  canSlide: boolean;
  dataKey: string;
  isInfinite: boolean;
  minScrollIndex: number;
  maxScrollIndex: number;
}
export interface SlideA11yProps {
  role?: "group";
  "aria-roledescription"?: "slide";
  "aria-label"?: string;
  "aria-current"?: "step" | boolean;
}

export interface VirtualSlide {
  vIndex: number;
  originalIndex: number;
  isClone: boolean;
  slideKey: string;
  isActive: boolean;
  isActual: boolean;
  a11yProps: SlideA11yProps;
}
