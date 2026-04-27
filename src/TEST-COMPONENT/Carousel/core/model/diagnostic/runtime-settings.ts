import {
  AUTOPLAY_PAGINATION_FACTOR,
  CAROUSEL_DRAG_CONFIG,
  CAROUSEL_DRAG_RELEASE_EPSILON,
  CAROUSEL_RELEASE_MOTION_CONFIG,
  DEFAULT_SETTINGS,
  HOVER_PAUSE_DELAY,
  MOTION_EPSILON,
  RENDER_WINDOW_BUFFER_MULTIPLIER,
  REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
  REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_EPSILON,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
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
    renderWindowBufferMultiplier: RENDER_WINDOW_BUFFER_MULTIPLIER,
  },
  repeatedClickSettings: {
    destinationPosition: REPEATED_CLICK_DESTINATION_POSITION,
    touchDestinationPosition: REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
    speedMultiplier: REPEATED_CLICK_SPEED_MULTIPLIER,
    accelerationDistanceShare: REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
    decelerationDistanceShare: REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
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
  releaseMotionConfig: {
    ...CAROUSEL_RELEASE_MOTION_CONFIG,
  },
  dragReleaseEpsilon: CAROUSEL_DRAG_RELEASE_EPSILON,
  motionSettings: {
    snapBackDuration: SNAP_BACK_DURATION,
    epsilon: MOTION_EPSILON,
  },
});
