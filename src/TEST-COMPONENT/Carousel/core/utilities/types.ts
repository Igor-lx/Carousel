import type { Slide } from "../types";

export interface CarouselLayout {
  length: number;
  visibleSlidesCount: number;
  virtualLength: number;
  totalVirtual: number;
  pageCount: number;
  canSlide: boolean;
  dataKey: string;
  isFinite: boolean;
}

export interface CarouselSlideRecord {
  slideData: Slide;
  layoutIndex: number;
  slideKey: string;
}

export interface SlideA11yProps {
  role?: "group";
  "aria-roledescription"?: "slide";
  "aria-label"?: string;
  "aria-current"?: "step" | boolean;
}

export interface VirtualSlide {
  slideData: Slide;
  slideKey: string;
  isActive: boolean;
  isActual: boolean;
  a11yProps: SlideA11yProps;
}

export interface RenderWindow {
  start: number;
  end: number;
}
