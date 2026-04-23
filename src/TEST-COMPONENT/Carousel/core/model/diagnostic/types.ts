import type { DragSpeedConfig } from "../../../../../shared";
import type { DevNoticeEntry } from "../../../../../shared";

export type { DragSpeedConfig } from "../../../../../shared";

export interface CarouselRuntimePropSettings {
  visibleSlidesCount: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
  autoplayInterval: number;
  errorAltPlaceholder: string;
}

export interface CarouselLayoutSettings {
  minVisibleSlides: number;
  renderWindowBufferMultiplier: number;
}

export interface CarouselRepeatedClickSettings {
  destinationPosition: number;
  speedMultiplier: number;
  epsilon: number;
}

export interface CarouselInteractionSettings {
  hoverPauseDelay: number;
  visibilityThreshold: number;
  autoplayPaginationFactor: number;
}

export interface CarouselDragSettings {
  COOLDOWN_MS: number;
  INTENT_THRESHOLD: number;
  RESISTANCE: number;
  RESISTANCE_CURVATURE: number;
  MAX_VELOCITY: number;
  EMA_ALPHA: number;
  SWIPE_VELOCITY_LIMIT: number;
  QUICK_SWIPE_MIN_OFFSET: number;
  MIN_SWIPE_DISTANCE: number;
  SWIPE_THRESHOLD_RATIO: number;
  RELEASE_EPSILON: number;
}

export interface CarouselMotionSettings {
  monotonicSpeedFactor: number;
  snapBackDuration: number;
  epsilon: number;
}

export interface CarouselRuntimeSettings extends CarouselRuntimePropSettings {
  layoutSettings: CarouselLayoutSettings;
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

export interface CarouselSlotAttachmentNoticeInput {
  isControlsOn: boolean;
  hasControlsSlot: boolean;
  isPaginationOn: boolean;
  hasPaginationSlot: boolean;
}

export type CarouselDiagnosticResolver = (
  input: CarouselDiagnosticPropsInput,
) => CarouselDiagnosticPayload;
