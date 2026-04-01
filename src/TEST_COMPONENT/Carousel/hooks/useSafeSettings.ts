import { useMemo } from "react";
import { DEFAULT_SETTINGS } from "../default_settings";
import { MIN_DELAY, MIN_SPEED } from "../const";

interface SafeSettingsProps {
  readonly speedAuto?: number;
  readonly speedStep?: number;
  readonly speedJump?: number;
  readonly delay?: number;
  readonly errAltPH?: string;
}

interface SafeSettingsResult {
  readonly speedAuto: number;
  readonly speedStep: number;
  readonly speedJump: number;
  readonly delay: number;
  readonly errAltPH: string;
}

export const useSafeSettings = ({
  speedAuto,
  speedStep,
  speedJump,
  delay,
  errAltPH,
}: SafeSettingsProps): SafeSettingsResult => {
  return useMemo(() => {
    const safeSpeedAuto =
      speedAuto !== undefined
        ? Math.max(MIN_SPEED, speedAuto)
        : DEFAULT_SETTINGS.speedAutoBase;

    const stepInput = speedStep ?? DEFAULT_SETTINGS.speedManualStep;
    const safeSpeedStep = Math.min(safeSpeedAuto, stepInput);

    const jumpInput = speedJump ?? DEFAULT_SETTINGS.speedManualJump;
    const safeSpeedJump = Math.min(safeSpeedStep, jumpInput);

    const safeDelay =
      delay !== undefined
        ? Math.max(MIN_DELAY, delay)
        : DEFAULT_SETTINGS.delayAuto;

    const safeErrAltPH = errAltPH?.trim()
      ? errAltPH
      : DEFAULT_SETTINGS.errAltPH;

    return {
      speedAuto: safeSpeedAuto,
      speedStep: safeSpeedStep,
      speedJump: safeSpeedJump,
      delay: safeDelay,
      errAltPH: safeErrAltPH,
    };
  }, [speedAuto, speedStep, speedJump, delay, errAltPH]);
};
