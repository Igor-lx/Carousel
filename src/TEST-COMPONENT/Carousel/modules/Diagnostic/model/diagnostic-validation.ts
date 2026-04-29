export const DURATION_UNIT = "ms";

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const formatDiagnosticValue = (value: unknown, unit?: string) => {
  if (typeof value === "number") {
    const formattedNumber = String(value);

    return unit && Number.isFinite(value)
      ? `${formattedNumber}${unit}`
      : formattedNumber;
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value === "undefined") {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

export const getDiagnosticFallbackReason = (
  fallbackValue: unknown,
  unit?: string,
) =>
  `Replaced with diagnostic fallback: ${formatDiagnosticValue(
    fallbackValue,
    unit,
  )}`;

export const getAllowedRangeReason = (
  minValue: number,
  maxValue: number,
  label = "allowed range",
) => `Clamped to ${label}: ${minValue}..${maxValue}`;

export const getInternalConstantNoticeMessage = (reason: string) =>
  `Invalid internal config. Runtime keeps the current value. ${reason}`;

export const isPositiveFiniteNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0;

export const isNonNegativeFiniteNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0;

export const isFiniteNumberInRange = (
  value: unknown,
  minValue: number,
  maxValue: number,
) => isFiniteNumber(value) && value >= minValue && value <= maxValue;

export const isPositiveIntegerAtLeast = (
  value: unknown,
  minValue: number,
) => isFiniteNumber(value) && Number.isInteger(value) && value >= minValue;

export const joinReasons = (...reasons: Array<string | undefined>) => {
  const definedReasons = reasons.filter(Boolean);

  return definedReasons.length > 0 ? definedReasons.join(". ") : undefined;
};

export const getPositiveIntegerReason = (value: unknown) => {
  if (!isFiniteNumber(value) || value <= 0) {
    return "Expected a positive integer";
  }

  if (!Number.isInteger(value)) {
    return "Rounded down to a positive integer";
  }

  return undefined;
};

export const getPositiveDurationReason = (value: unknown) =>
  !isFiniteNumber(value) || value <= 0
    ? "Expected a positive duration"
    : undefined;

export const getNonNegativeDurationReason = (value: unknown) =>
  !isFiniteNumber(value) || value < 0
    ? "Expected a non-negative duration"
    : undefined;

export const getNonEmptyStringReason = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? undefined
    : "Expected a non-empty string";
