import type {
  DragEngineConfig,
  ReleaseMotionConfig,
} from "../../../../../shared";
import type { DevNoticeEntry } from "../../../../../shared";

export type {
  DragEngineConfig,
  ReleaseMotionConfig,
} from "../../../../../shared";

export interface CarouselRuntimePropSettings {
  visibleSlidesCount: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
  autoplayInterval: number;
  errorAltPlaceholder: string;
}

export interface CarouselLayoutSettings {
  renderWindowBufferMultiplier: number;
}

export interface CarouselRepeatedClickSettings {
  destinationPosition: number;
  touchDestinationPosition: number;
  speedMultiplier: number;
  accelerationDistanceShare: number;
  decelerationDistanceShare: number;
  epsilon: number;
}

export interface CarouselInteractionSettings {
  hoverPauseDelay: number;
  visibilityThreshold: number;
  autoplayPaginationFactor: number;
}

export type CarouselDragConfig = Required<DragEngineConfig>;

export interface CarouselMotionSettings {
  snapBackDuration: number;
  epsilon: number;
}

export interface CarouselRuntimeSettings extends CarouselRuntimePropSettings {
  layoutSettings: CarouselLayoutSettings;
  repeatedClickSettings: CarouselRepeatedClickSettings;
  interactionSettings: CarouselInteractionSettings;
  dragConfig: CarouselDragConfig;
  releaseMotionConfig: ReleaseMotionConfig;
  dragReleaseEpsilon: number;
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
