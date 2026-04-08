import { useMemo } from "react";
import { MIN_SPEED, MIN_DELAY } from "../model/constants";
import  { DEFAULT_SETTINGS } from "../model/defaultSettings";


interface SafeSettingsProps {
  speedAuto?: number;
  speedStep?: number;
  speedJump?: number;
  delay?: number;
  errAltPH?: string;
}

interface SafeSettingsResult {
  speedAuto: number;
  speedStep: number;
  speedJump: number;
  delay: number;
  errAltPH: string;
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
