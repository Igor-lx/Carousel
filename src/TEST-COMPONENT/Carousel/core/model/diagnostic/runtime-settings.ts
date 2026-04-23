import {
  AUTOPLAY_PAGINATION_FACTOR,
  CAROUSEL_DRAG_CONFIG,
  CAROUSEL_DRAG_RELEASE_EPSILON,
  CAROUSEL_DRAG_SPEED_CONFIG,
  DEFAULT_SETTINGS,
  HOVER_PAUSE_DELAY,
  MIN_VISIBLE_SLIDES,
  MOTION_EPSILON,
  MOTION_MONOTONIC_SPEED_FACTOR,
  RENDER_WINDOW_BUFFER_MULTIPLIER,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_EPSILON,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  SNAP_BACK_DURATION,
  VISIBILITY_THRESHOLD,
} from "../config";
import type {
  CarouselDiagnosticPropsInput,
  CarouselRuntimeSettings,
} from "./types";

const resolveProvidedValue = <T>(value: unknown, fallback: T) =>
  typeof value === "undefined" ? fallback : (value as T);

export const resolveRawCarouselRuntimeSettings = ({
  visibleSlidesNr,
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: CarouselDiagnosticPropsInput): CarouselRuntimeSettings => ({
  visibleSlidesCount: resolveProvidedValue(
    visibleSlidesNr,
    DEFAULT_SETTINGS.visibleSlidesNr,
  ),
  autoplayDuration: resolveProvidedValue(
    durationAutoplay,
    DEFAULT_SETTINGS.durationAutoplay,
  ),
  stepDuration: resolveProvidedValue(durationStep, DEFAULT_SETTINGS.durationStep),
  jumpDuration: resolveProvidedValue(durationJump, DEFAULT_SETTINGS.durationJump),
  autoplayInterval: resolveProvidedValue(
    intervalAutoplay,
    DEFAULT_SETTINGS.intervalAutoplay,
  ),
  errorAltPlaceholder: resolveProvidedValue(
    errAltPlaceholder,
    DEFAULT_SETTINGS.errAltPlaceholder,
  ),
  layoutSettings: {
    minVisibleSlides: MIN_VISIBLE_SLIDES,
    renderWindowBufferMultiplier: RENDER_WINDOW_BUFFER_MULTIPLIER,
  },
  repeatedClickSettings: {
    destinationPosition: REPEATED_CLICK_DESTINATION_POSITION,
    speedMultiplier: REPEATED_CLICK_SPEED_MULTIPLIER,
    epsilon: REPEATED_CLICK_EPSILON,
  },
  interactionSettings: {
    hoverPauseDelay: HOVER_PAUSE_DELAY,
    visibilityThreshold: VISIBILITY_THRESHOLD,
    autoplayPaginationFactor: AUTOPLAY_PAGINATION_FACTOR,
  },
  dragConfig: {
    ...CAROUSEL_DRAG_CONFIG,
  },
  dragSpeedConfig: {
    ...CAROUSEL_DRAG_SPEED_CONFIG,
  },
  dragReleaseEpsilon: CAROUSEL_DRAG_RELEASE_EPSILON,
  motionSettings: {
    monotonicSpeedFactor: MOTION_MONOTONIC_SPEED_FACTOR,
    snapBackDuration: SNAP_BACK_DURATION,
    epsilon: MOTION_EPSILON,
  },
});
