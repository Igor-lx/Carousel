export const DURATION_UNIT = "ms";

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const getInternalConstantNoticeMessage = (reason: string) =>
  `${reason}; Diagnostic reports this internal constant but does not normalize runtime behavior`;

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

  return definedReasons.length > 0 ? definedReasons.join("; ") : undefined;
};

export const getPositiveIntegerReason = (value: unknown) => {
  if (!isFiniteNumber(value) || value <= 0) {
    return "expected a finite positive integer";
  }

  if (!Number.isInteger(value)) {
    return "coerced to a positive integer";
  }

  return undefined;
};

export const getPositiveDurationReason = (value: unknown) =>
  !isFiniteNumber(value) || value <= 0
    ? `expected a finite positive duration in ${DURATION_UNIT}`
    : undefined;

export const getNonNegativeDurationReason = (value: unknown) =>
  !isFiniteNumber(value) || value < 0
    ? `expected a finite non-negative duration in ${DURATION_UNIT}`
    : undefined;

export const getNonEmptyStringReason = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? undefined
    : "expected a non-empty string";

