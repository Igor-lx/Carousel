import {
  DEFAULT_SETTINGS,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_AUTOPLAY_INTERVAL,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
  MIN_VISIBLE_SLIDES,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  SAFE_DURATION_FALLBACK,
} from "../model/config";

interface SafeSettingsProps {
  visibleSlidesNr?: number;
  durationAutoplay?: number;
  durationStep?: number;
  durationJump?: number;
  intervalAutoplay?: number;
  errAltPlaceholder?: string;
}

interface SafeSettingsResult {
  visibleSlidesCount: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
  autoplayInterval: number;
  errorAltPlaceholder: string;
}

interface RepeatedClickSettingsResult {
  destinationPosition: number;
  speedMultiplier: number;
}

const getSafePositiveDuration = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (Number.isFinite(fallback) && fallback > 0) {
    return fallback;
  }

  return SAFE_DURATION_FALLBACK;
};

const getSafeVisibleSlidesCount = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.max(MIN_VISIBLE_SLIDES, Math.floor(value));
  }

  if (Number.isFinite(fallback) && fallback > 0) {
    return Math.max(MIN_VISIBLE_SLIDES, Math.floor(fallback));
  }

  return MIN_VISIBLE_SLIDES;
};

const clampRepeatedClickDestinationPosition = (value: number) => {
  if (!Number.isFinite(value)) {
    return MIN_REPEATED_CLICK_DESTINATION_POSITION;
  }

  return Math.max(
    MIN_REPEATED_CLICK_DESTINATION_POSITION,
    Math.min(MAX_REPEATED_CLICK_DESTINATION_POSITION, value),
  );
};

const getSafeAutoplayInterval = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(MIN_AUTOPLAY_INTERVAL, value);
  }

  if (Number.isFinite(fallback)) {
    return Math.max(MIN_AUTOPLAY_INTERVAL, fallback);
  }

  return MIN_AUTOPLAY_INTERVAL;
};

export const resolveRepeatedClickSettings =
  (): RepeatedClickSettingsResult => {
    return {
      destinationPosition: clampRepeatedClickDestinationPosition(
        REPEATED_CLICK_DESTINATION_POSITION,
      ),
      speedMultiplier:
        Number.isFinite(REPEATED_CLICK_SPEED_MULTIPLIER) &&
        REPEATED_CLICK_SPEED_MULTIPLIER >= MIN_REPEATED_CLICK_SPEED_MULTIPLIER
          ? REPEATED_CLICK_SPEED_MULTIPLIER
          : MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
    };
  };

export const SAFE_REPEATED_CLICK_SETTINGS = resolveRepeatedClickSettings();

export function resolveSafeSettings({
  visibleSlidesNr,
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: SafeSettingsProps): SafeSettingsResult {
  const visibleSlidesCount = getSafeVisibleSlidesCount(
    visibleSlidesNr,
    DEFAULT_SETTINGS.visibleSlidesNr,
  );

  const autoplayDuration = getSafePositiveDuration(
    durationAutoplay,
    DEFAULT_SETTINGS.durationAutoplay,
  );

  const resolvedStepDuration = getSafePositiveDuration(
    durationStep,
    DEFAULT_SETTINGS.durationStep,
  );
  const stepDuration = Math.min(autoplayDuration, resolvedStepDuration);

  const resolvedJumpDuration = getSafePositiveDuration(
    durationJump,
    DEFAULT_SETTINGS.durationJump,
  );
  const jumpDuration = Math.min(stepDuration, resolvedJumpDuration);

  const autoplayInterval = getSafeAutoplayInterval(
    intervalAutoplay,
    DEFAULT_SETTINGS.intervalAutoplay,
  );

  const errorAltPlaceholder = errAltPlaceholder?.trim()
    ? errAltPlaceholder
    : DEFAULT_SETTINGS.errAltPlaceholder;

  return {
    visibleSlidesCount,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
  };
}
