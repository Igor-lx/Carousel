import {
  MIN_DELAY,
  MIN_SPEED,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_SPEED_MULTIPLIER,
} from "../model/constants";
import { DEFAULT_SETTINGS } from "../model/defaultSettings";

interface SafeSettingsProps {
  durationAutoplay?: number;
  durationStep?: number;
  durationJump?: number;
  intervalAutoplay?: number;
  errAltPlaceholder?: string;
}

interface SafeSettingsResult {
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

const getSafeDuration = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (Number.isFinite(fallback) && fallback > 0) {
    return fallback;
  }

  return MIN_SPEED;
};

const clampUnitPosition = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
};

export const resolveRepeatedClickSettings =
  (): RepeatedClickSettingsResult => {
    return {
      destinationPosition: clampUnitPosition(
        REPEATED_CLICK_DESTINATION_POSITION,
      ),
      speedMultiplier:
        Number.isFinite(REPEATED_CLICK_SPEED_MULTIPLIER) &&
        REPEATED_CLICK_SPEED_MULTIPLIER >= 1
          ? REPEATED_CLICK_SPEED_MULTIPLIER
          : 1,
    };
  };

export const SAFE_REPEATED_CLICK_SETTINGS = resolveRepeatedClickSettings();

export function resolveSafeSettings({
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: SafeSettingsProps): SafeSettingsResult {
  const autoplayDuration = getSafeDuration(
    durationAutoplay,
    DEFAULT_SETTINGS.durationAutoplay,
  );

  const resolvedStepDuration = getSafeDuration(
    durationStep,
    DEFAULT_SETTINGS.durationStep,
  );
  const stepDuration = Math.min(autoplayDuration, resolvedStepDuration);

  const resolvedJumpDuration = getSafeDuration(
    durationJump,
    DEFAULT_SETTINGS.durationJump,
  );
  const jumpDuration = Math.min(stepDuration, resolvedJumpDuration);

  const autoplayInterval =
    intervalAutoplay !== undefined
      ? Math.max(MIN_DELAY, intervalAutoplay)
      : DEFAULT_SETTINGS.intervalAutoplay;

  const errorAltPlaceholder = errAltPlaceholder?.trim()
    ? errAltPlaceholder
    : DEFAULT_SETTINGS.errAltPlaceholder;

  return {
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
  };
}
