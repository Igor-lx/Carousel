import { DEFAULT_SETTINGS } from "../config";
import { SAFE_DEFAULT_SETTINGS } from "./runtime-config";
import {
  isValueProvided,
  normalizeAutoplayInterval,
  normalizeErrorAltPlaceholder,
  normalizePositiveDuration,
  normalizeVisibleSlidesCount,
} from "./helpers";

export interface CarouselNormalizationInput {
  visibleSlidesNr?: unknown;
  durationAutoplay?: unknown;
  durationStep?: unknown;
  durationJump?: unknown;
  intervalAutoplay?: unknown;
  errAltPlaceholder?: unknown;
}

export interface CarouselNormalizedSettings {
  visibleSlidesCount: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
  autoplayInterval: number;
  errorAltPlaceholder: string;
}

export const normalizeCarouselSettings = ({
  visibleSlidesNr,
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: CarouselNormalizationInput): CarouselNormalizedSettings => {
  const visibleSlidesSource = isValueProvided(visibleSlidesNr)
    ? visibleSlidesNr
    : SAFE_DEFAULT_SETTINGS.visibleSlidesNr;
  const visibleSlidesCount = normalizeVisibleSlidesCount(
    visibleSlidesSource,
    SAFE_DEFAULT_SETTINGS.visibleSlidesNr,
  );

  const autoplayDurationSource = isValueProvided(durationAutoplay)
    ? durationAutoplay
    : SAFE_DEFAULT_SETTINGS.durationAutoplay;
  const autoplayDuration = normalizePositiveDuration(
    autoplayDurationSource,
    SAFE_DEFAULT_SETTINGS.durationAutoplay,
  );

  const stepDurationSource = isValueProvided(durationStep)
    ? durationStep
    : SAFE_DEFAULT_SETTINGS.durationStep;
  const normalizedStepDuration = normalizePositiveDuration(
    stepDurationSource,
    SAFE_DEFAULT_SETTINGS.durationStep,
  );
  const stepDuration = Math.min(autoplayDuration, normalizedStepDuration);

  const jumpDurationSource = isValueProvided(durationJump)
    ? durationJump
    : SAFE_DEFAULT_SETTINGS.durationJump;
  const normalizedJumpDuration = normalizePositiveDuration(
    jumpDurationSource,
    SAFE_DEFAULT_SETTINGS.durationJump,
  );
  const jumpDuration = Math.min(stepDuration, normalizedJumpDuration);

  const autoplayIntervalSource = isValueProvided(intervalAutoplay)
    ? intervalAutoplay
    : SAFE_DEFAULT_SETTINGS.intervalAutoplay;
  const autoplayInterval = normalizeAutoplayInterval(
    autoplayIntervalSource,
    SAFE_DEFAULT_SETTINGS.intervalAutoplay,
  );

  const errorAltPlaceholderSource = isValueProvided(errAltPlaceholder)
    ? errAltPlaceholder
    : DEFAULT_SETTINGS.errAltPlaceholder;
  const errorAltPlaceholder = normalizeErrorAltPlaceholder(
    errorAltPlaceholderSource,
    DEFAULT_SETTINGS.errAltPlaceholder,
  );

  return {
    visibleSlidesCount,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
  };
};
