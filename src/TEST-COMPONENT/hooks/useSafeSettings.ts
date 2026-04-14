import { useMemo } from "react";
import { MIN_SPEED, MIN_DELAY } from "../model/constants";
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

const getSafeDuration = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (Number.isFinite(fallback) && fallback > 0) {
    return fallback;
  }

  return MIN_SPEED;
};

export function useSafeSettings({
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: SafeSettingsProps): SafeSettingsResult {
  return useMemo(() => {
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
  }, [
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  ]);
}
