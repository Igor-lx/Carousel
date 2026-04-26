const clampMagnitude = (value: number, limit: number) => {
  if (!Number.isFinite(value) || !(limit > 0)) {
    return 0;
  }

  return Math.sign(value) * Math.min(Math.abs(value), limit);
};

export const calculateEMA = (
  prevV: number,
  instantV: number,
  alpha: number,
): number => {
  return prevV * (1 - alpha) + instantV * alpha;
};

export const getFrameAdjustedEmaAlpha = (alpha: number, dt: number) => {
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  const frameCount = Math.max(1, dt / (1000 / 60));

  return 1 - Math.pow(1 - safeAlpha, frameCount);
};

const getElapsedDecayEmaAlpha = (alpha: number, dt: number) => {
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  const frameCount = Math.max(0, dt / (1000 / 60));

  return 1 - Math.pow(1 - safeAlpha, frameCount);
};

export const decayReleaseVelocity = (
  velocity: number,
  alpha: number,
  dt: number,
) => calculateEMA(velocity, 0, getElapsedDecayEmaAlpha(alpha, dt));

export const clampVelocityMagnitude = clampMagnitude;
