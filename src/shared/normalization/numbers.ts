export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const coerceFiniteNumber = (value: unknown, safeValue: number) =>
  isFiniteNumber(value) ? value : safeValue;

export const coercePositiveNumber = (value: unknown, safeValue: number) =>
  isFiniteNumber(value) && value > 0 ? value : safeValue;

export const coerceNonNegativeNumber = (value: unknown, safeValue: number) =>
  isFiniteNumber(value) && value >= 0 ? value : safeValue;

export const coerceClampedNumber = (
  value: unknown,
  safeValue: number,
  min: number,
  max: number,
) => clampNumber(coerceFiniteNumber(value, safeValue), min, max);
