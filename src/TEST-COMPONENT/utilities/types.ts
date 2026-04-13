import type { Slide } from "../Carousel.types";

export interface CarouselLayout {
  length: number;
  clampedVisible: number;
  virtualLength: number;
  totalVirtual: number;
  pageCount: number;
  canSlide: boolean;
  dataKey: string;
  isFinite: boolean;
}

export interface ResolvedCarouselSlide {
  slideData: Slide;
  sourceIndex: number;
  positionIndex: number;
  slideKey: string;
}

export interface SlideA11yProps {
  role?: "group";
  "aria-roledescription"?: "slide";
  "aria-label"?: string;
  "aria-current"?: "step" | boolean;
}

export interface VirtualSlide {
  vIndex: number;
  slideIndex: number;
  sourceIndex: number;
  slideData: Slide;
  isClone: boolean;
  slideKey: string;
  isActive: boolean;
  isActual: boolean;
  a11yProps: SlideA11yProps;
}

export interface RenderWindow {
  start: number;
  end: number;
}
