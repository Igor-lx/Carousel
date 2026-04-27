const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const getSafeResistance = (resistance: number) =>
  clamp(resistance, 0, 1);

export const applyResistance = (
  offset: number,
  resistance: number,
  curvature: number,
): number => {
  const sign = Math.sign(offset);
  const abs = Math.abs(offset);
  const safeResistance = getSafeResistance(resistance);
  const resistanceStrength =
    safeResistance <= 0
      ? 0
      : safeResistance / Math.max(1 - safeResistance, 0.001);

  return (
    sign *
    (abs /
      (1 + abs * Math.max(0, curvature) * resistanceStrength))
  );
};
