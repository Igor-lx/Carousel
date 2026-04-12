import { useMemo } from "react";
import { MIN_SPEED, MIN_DELAY } from "../model/constants";
import { DEFAULT_SETTINGS } from "../model/defaultSettings";

interface SafeSettingsProps {
  speedAuto?: number;
  speedStep?: number;
  speedJump?: number;
  delay?: number;
  errAltPlaceholder?: string;
}

interface SafeSettingsResult {
  speedAuto: number;
  speedStep: number;
  speedJump: number;
  delay: number;
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
  speedAuto,
  speedStep,
  speedJump,
  delay,
  errAltPlaceholder, 
}: SafeSettingsProps): SafeSettingsResult => {
  return useMemo(() => {
    const safeSpeedAuto = getSafeDuration(
      speedAuto,
      DEFAULT_SETTINGS.speedAutoBase,
    );

    const stepInput = getSafeDuration(
      speedStep,
      DEFAULT_SETTINGS.speedManualStep,
    );
    const safeSpeedStep = Math.min(safeSpeedAuto, stepInput);

    const jumpInput = getSafeDuration(
      speedJump,
      DEFAULT_SETTINGS.speedManualJump,
    );
    const safeSpeedJump = Math.min(safeSpeedStep, jumpInput);

    const safeDelay =
      delay !== undefined
        ? Math.max(MIN_DELAY, delay)
        : DEFAULT_SETTINGS.delayAuto;

    const safeErrAltPlaceholder = errAltPlaceholder?.trim()
      ? errAltPlaceholder
      : DEFAULT_SETTINGS.errAltPlaceholder;

    return {
      speedAuto: safeSpeedAuto,
      speedStep: safeSpeedStep,
      speedJump: safeSpeedJump,
      delay: safeDelay,
      errAltPlaceholder: safeErrAltPlaceholder,
    };
  }, [speedAuto, speedStep, speedJump, delay, errAltPlaceholder]);
};
