import type { DragSpeedConfig } from "../../../../../shared";
import type { DevNoticeEntry } from "../../../../../shared";

export interface CarouselRuntimePropSettings {
  visibleSlidesCount: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
  autoplayInterval: number;
  errorAltPlaceholder: string;
}

export interface CarouselRepeatedClickSettings {
  destinationPosition: number;
  speedMultiplier: number;
}

export interface CarouselInteractionSettings {
  hoverPauseDelay: number;
  visibilityThreshold: number;
  autoplayPaginationFactor: number;
}

export interface CarouselDragSettings {
  RESISTANCE: number;
  RESISTANCE_CURVATURE: number;
  INTENT_THRESHOLD: number;
  MAX_VELOCITY: number;
  EMA_ALPHA: number;
  SWIPE_THRESHOLD_RATIO: number;
}

export interface CarouselMotionSettings {
  monotonicSpeedFactor: number;
  snapBackDuration: number;
}

export interface CarouselRuntimeSettings extends CarouselRuntimePropSettings {
  repeatedClickSettings: CarouselRepeatedClickSettings;
  interactionSettings: CarouselInteractionSettings;
  dragSettings: CarouselDragSettings;
  dragDurationRampSettings: DragSpeedConfig;
  motionSettings: CarouselMotionSettings;
}

export interface CarouselDiagnosticPropsInput {
  visibleSlidesNr?: unknown;
  durationAutoplay?: unknown;
  durationStep?: unknown;
  durationJump?: unknown;
  intervalAutoplay?: unknown;
  errAltPlaceholder?: unknown;
}

export interface CarouselDiagnosticPayload {
  settings: CarouselRuntimeSettings;
  correctionEntries: DevNoticeEntry[];
}

export interface CarouselPerfectPageLayoutNoticeInput {
  hasPerfectPageLayout: boolean;
  rawLength: number;
  extendedLength: number;
  visibleSlidesCount: number;
  didExtendLayout: boolean;
}

export type CarouselDiagnosticResolver = (
  input: CarouselDiagnosticPropsInput,
) => CarouselDiagnosticPayload;
