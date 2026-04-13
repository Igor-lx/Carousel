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
  durationAutoplay: number;
  durationStep: number;
  durationJump: number;
  intervalAutoplay: number;
  errAltPlaceholder: string;
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

export const useSafeSettings = ({
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder, 
}: SafeSettingsProps): SafeSettingsResult => {
  return useMemo(() => {
    const safeDurationAutoplay = getSafeDuration(
      durationAutoplay,
      DEFAULT_SETTINGS.durationAutoplay,
    );

    const durationStepInput = getSafeDuration(
      durationStep,
      DEFAULT_SETTINGS.durationStep,
    );
    const safeDurationStep = Math.min(
      safeDurationAutoplay,
      durationStepInput,
    );

    const durationJumpInput = getSafeDuration(
      durationJump,
      DEFAULT_SETTINGS.durationJump,
    );
    const safeDurationJump = Math.min(
      safeDurationStep,
      durationJumpInput,
    );

    const safeIntervalAutoplay =
      intervalAutoplay !== undefined
        ? Math.max(MIN_DELAY, intervalAutoplay)
        : DEFAULT_SETTINGS.intervalAutoplay;

    const safeErrAltPlaceholder = errAltPlaceholder?.trim()
      ? errAltPlaceholder
      : DEFAULT_SETTINGS.errAltPlaceholder;

    return {
      durationAutoplay: safeDurationAutoplay,
      durationStep: safeDurationStep,
      durationJump: safeDurationJump,
      intervalAutoplay: safeIntervalAutoplay,
      errAltPlaceholder: safeErrAltPlaceholder,
    };
  }, [
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  ]);
};
