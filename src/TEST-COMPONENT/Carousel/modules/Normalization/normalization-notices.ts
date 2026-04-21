import type { DevNoticeEntry } from "../../../../shared";
import {
  AUTOPLAY_PAGINATION_FACTOR,
  DEFAULT_SETTINGS,
  DRAG_DURATION_RAMP_CONFIG,
  DRAG_SETTINGS_CONFIG,
  HARD_DRAG_DURATION_RAMP_SETTINGS,
  HARD_DRAG_SETTINGS,
  HARD_INTERACTION_SETTINGS,
  HARD_MOTION_SETTINGS,
  HARD_REPEATED_CLICK_SETTINGS,
  HOVER_PAUSE_DELAY,
  MAX_DRAG_DURATION_RATIO,
  MAX_DRAG_EMA_ALPHA,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_VISIBILITY_THRESHOLD,
  MIN_AUTOPLAY_INTERVAL,
  MIN_DRAG_DURATION_RATIO,
  MIN_DRAG_EMA_ALPHA,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
  MIN_VISIBLE_SLIDES,
  MIN_VISIBILITY_THRESHOLD,
  MOTION_MONOTONIC_SPEED_FACTOR,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  SAFE_DURATION,
  SNAP_BACK_DURATION,
  VISIBILITY_THRESHOLD,
} from "../../core/model/config";
import {
  isValueProvided,
  normalizeAutoplayInterval,
  normalizeAutoplayPaginationFactor,
  normalizeDragDurationRatio,
  normalizeDragEmaAlpha,
  normalizeErrorAltPlaceholder,
  normalizeNonNegativeNumber,
  normalizePositiveDuration,
  normalizePositiveNumber,
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickSpeedMultiplier,
  normalizeVisibilityThreshold,
  normalizeVisibleSlidesCount,
} from "../../core/model/normalization/helpers";
import {
  SAFE_DEFAULT_SETTINGS,
} from "../../core/model/normalization/runtime-config";

type CarouselNormalizationNoticeInput = {
  visibleSlidesNr?: unknown;
  durationAutoplay?: unknown;
  durationStep?: unknown;
  durationJump?: unknown;
  intervalAutoplay?: unknown;
  errAltPlaceholder?: unknown;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const getCorrectionFieldName = (field: string, isPropProvided: boolean) =>
  isPropProvided ? field : `DEFAULT_SETTINGS.${field}`;

const joinReasons = (...reasons: Array<string | undefined>) => {
  const definedReasons = reasons.filter(Boolean);

  return definedReasons.length > 0
    ? definedReasons.join("; ")
    : undefined;
};

const getPositiveIntegerReason = (value: unknown) => {
  if (!isFiniteNumber(value) || value <= 0) {
    return "expected a finite positive integer";
  }

  if (!Number.isInteger(value)) {
    return "coerced to a positive integer";
  }

  return undefined;
};

const getPositiveDurationReason = (value: unknown) =>
  !isFiniteNumber(value) || value <= 0
    ? "expected a finite positive duration"
    : undefined;

const getPositiveIntervalReason = (value: unknown) =>
  !isFiniteNumber(value) || value <= 0
    ? "expected a finite positive interval"
    : undefined;

const getSafeAutoplayIntervalReason = (value: unknown) =>
  !isFiniteNumber(value) || value < MIN_AUTOPLAY_INTERVAL
    ? `expected a finite interval of at least ${MIN_AUTOPLAY_INTERVAL}ms`
    : undefined;

const getNonEmptyStringReason = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? undefined
    : "expected a non-empty string";

const collectDefaultSettingsCorrections = (): DevNoticeEntry[] => {
  const safeVisibleSlidesNr = normalizeVisibleSlidesCount(
    DEFAULT_SETTINGS.visibleSlidesNr,
    MIN_VISIBLE_SLIDES,
  );
  const safeDurationAutoplay = normalizePositiveDuration(
    DEFAULT_SETTINGS.durationAutoplay,
    SAFE_DURATION,
  );
  const safeDurationStep = normalizePositiveDuration(
    DEFAULT_SETTINGS.durationStep,
    SAFE_DURATION,
  );
  const safeDurationJump = normalizePositiveDuration(
    DEFAULT_SETTINGS.durationJump,
    SAFE_DURATION,
  );
  const safeIntervalAutoplay = normalizePositiveDuration(
    DEFAULT_SETTINGS.intervalAutoplay,
    SAFE_DURATION,
  );

  const corrections: DevNoticeEntry[] = [];

  if (safeVisibleSlidesNr !== DEFAULT_SETTINGS.visibleSlidesNr) {
    corrections.push({
      field: "DEFAULT_SETTINGS.visibleSlidesNr",
      provided: DEFAULT_SETTINGS.visibleSlidesNr,
      normalized: safeVisibleSlidesNr,
      reason: getPositiveIntegerReason(DEFAULT_SETTINGS.visibleSlidesNr),
    });
  }

  if (safeDurationAutoplay !== DEFAULT_SETTINGS.durationAutoplay) {
    corrections.push({
      field: "DEFAULT_SETTINGS.durationAutoplay",
      provided: DEFAULT_SETTINGS.durationAutoplay,
      normalized: safeDurationAutoplay,
      reason: getPositiveDurationReason(DEFAULT_SETTINGS.durationAutoplay),
    });
  }

  if (safeDurationStep !== DEFAULT_SETTINGS.durationStep) {
    corrections.push({
      field: "DEFAULT_SETTINGS.durationStep",
      provided: DEFAULT_SETTINGS.durationStep,
      normalized: safeDurationStep,
      reason: getPositiveDurationReason(DEFAULT_SETTINGS.durationStep),
    });
  }

  if (safeDurationJump !== DEFAULT_SETTINGS.durationJump) {
    corrections.push({
      field: "DEFAULT_SETTINGS.durationJump",
      provided: DEFAULT_SETTINGS.durationJump,
      normalized: safeDurationJump,
      reason: getPositiveDurationReason(DEFAULT_SETTINGS.durationJump),
    });
  }

  if (safeIntervalAutoplay !== DEFAULT_SETTINGS.intervalAutoplay) {
    corrections.push({
      field: "DEFAULT_SETTINGS.intervalAutoplay",
      provided: DEFAULT_SETTINGS.intervalAutoplay,
      normalized: safeIntervalAutoplay,
      reason: getPositiveIntervalReason(DEFAULT_SETTINGS.intervalAutoplay),
    });
  }

  return corrections;
};

const collectRepeatedClickCorrections = (): DevNoticeEntry[] => {
  const destinationPosition = normalizeRepeatedClickDestination(
    REPEATED_CLICK_DESTINATION_POSITION,
    HARD_REPEATED_CLICK_SETTINGS.destinationPosition,
  );
  const speedMultiplier = normalizeRepeatedClickSpeedMultiplier(
    REPEATED_CLICK_SPEED_MULTIPLIER,
    HARD_REPEATED_CLICK_SETTINGS.speedMultiplier,
  );
  const corrections: DevNoticeEntry[] = [];

  if (destinationPosition !== REPEATED_CLICK_DESTINATION_POSITION) {
    corrections.push({
      field: "REPEATED_CLICK_DESTINATION_POSITION",
      provided: REPEATED_CLICK_DESTINATION_POSITION,
      normalized: destinationPosition,
      reason:
        isFiniteNumber(REPEATED_CLICK_DESTINATION_POSITION)
          ? `clamped to [${MIN_REPEATED_CLICK_DESTINATION_POSITION}, ${MAX_REPEATED_CLICK_DESTINATION_POSITION}]`
          : "expected a finite value between 0 and 1",
    });
  }

  if (speedMultiplier !== REPEATED_CLICK_SPEED_MULTIPLIER) {
    corrections.push({
      field: "REPEATED_CLICK_SPEED_MULTIPLIER",
      provided: REPEATED_CLICK_SPEED_MULTIPLIER,
      normalized: speedMultiplier,
      reason: `expected a finite value greater than or equal to ${MIN_REPEATED_CLICK_SPEED_MULTIPLIER}`,
    });
  }

  return corrections;
};

const collectInteractionCorrections = (): DevNoticeEntry[] => {
  const hoverPauseDelay = normalizeNonNegativeNumber(
    HOVER_PAUSE_DELAY,
    HARD_INTERACTION_SETTINGS.hoverPauseDelay,
  );
  const visibilityThreshold = normalizeVisibilityThreshold(
    VISIBILITY_THRESHOLD,
    HARD_INTERACTION_SETTINGS.visibilityThreshold,
  );
  const autoplayPaginationFactor = normalizeAutoplayPaginationFactor(
    AUTOPLAY_PAGINATION_FACTOR,
    HARD_INTERACTION_SETTINGS.autoplayPaginationFactor,
  );
  const corrections: DevNoticeEntry[] = [];

  if (hoverPauseDelay !== HOVER_PAUSE_DELAY) {
    corrections.push({
      field: "HOVER_PAUSE_DELAY",
      provided: HOVER_PAUSE_DELAY,
      normalized: hoverPauseDelay,
      reason: "expected a finite non-negative delay",
    });
  }

  if (visibilityThreshold !== VISIBILITY_THRESHOLD) {
    corrections.push({
      field: "VISIBILITY_THRESHOLD",
      provided: VISIBILITY_THRESHOLD,
      normalized: visibilityThreshold,
      reason: isFiniteNumber(VISIBILITY_THRESHOLD)
        ? `clamped to [${MIN_VISIBILITY_THRESHOLD}, ${MAX_VISIBILITY_THRESHOLD}]`
        : "expected a finite threshold between 0 and 1",
    });
  }

  if (autoplayPaginationFactor !== AUTOPLAY_PAGINATION_FACTOR) {
    corrections.push({
      field: "AUTOPLAY_PAGINATION_FACTOR",
      provided: AUTOPLAY_PAGINATION_FACTOR,
      normalized: autoplayPaginationFactor,
      reason: "expected a finite factor strictly between 0 and 1",
    });
  }

  return corrections;
};

const collectDragCorrections = (): DevNoticeEntry[] => {
  const resistance = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.RESISTANCE,
    HARD_DRAG_SETTINGS.RESISTANCE,
  );
  const resistanceCurvature = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.RESISTANCE_CURVATURE,
    HARD_DRAG_SETTINGS.RESISTANCE_CURVATURE,
  );
  const intentThreshold = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.INTENT_THRESHOLD,
    HARD_DRAG_SETTINGS.INTENT_THRESHOLD,
  );
  const maxVelocity = normalizePositiveNumber(
    DRAG_SETTINGS_CONFIG.MAX_VELOCITY,
    HARD_DRAG_SETTINGS.MAX_VELOCITY,
  );
  const emaAlpha = normalizeDragEmaAlpha(
    DRAG_SETTINGS_CONFIG.EMA_ALPHA,
    HARD_DRAG_SETTINGS.EMA_ALPHA,
  );
  const swipeThresholdRatio = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.SWIPE_THRESHOLD_RATIO,
    HARD_DRAG_SETTINGS.SWIPE_THRESHOLD_RATIO,
  );
  const corrections: DevNoticeEntry[] = [];

  if (resistance !== DRAG_SETTINGS_CONFIG.RESISTANCE) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.RESISTANCE",
      provided: DRAG_SETTINGS_CONFIG.RESISTANCE,
      normalized: resistance,
      reason: "expected a finite non-negative value",
    });
  }

  if (resistanceCurvature !== DRAG_SETTINGS_CONFIG.RESISTANCE_CURVATURE) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.RESISTANCE_CURVATURE",
      provided: DRAG_SETTINGS_CONFIG.RESISTANCE_CURVATURE,
      normalized: resistanceCurvature,
      reason: "expected a finite non-negative value",
    });
  }

  if (intentThreshold !== DRAG_SETTINGS_CONFIG.INTENT_THRESHOLD) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.INTENT_THRESHOLD",
      provided: DRAG_SETTINGS_CONFIG.INTENT_THRESHOLD,
      normalized: intentThreshold,
      reason: "expected a finite non-negative value",
    });
  }

  if (maxVelocity !== DRAG_SETTINGS_CONFIG.MAX_VELOCITY) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.MAX_VELOCITY",
      provided: DRAG_SETTINGS_CONFIG.MAX_VELOCITY,
      normalized: maxVelocity,
      reason: "expected a finite positive value",
    });
  }

  if (emaAlpha !== DRAG_SETTINGS_CONFIG.EMA_ALPHA) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.EMA_ALPHA",
      provided: DRAG_SETTINGS_CONFIG.EMA_ALPHA,
      normalized: emaAlpha,
      reason: isFiniteNumber(DRAG_SETTINGS_CONFIG.EMA_ALPHA)
        ? `clamped to [${MIN_DRAG_EMA_ALPHA}, ${MAX_DRAG_EMA_ALPHA}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (swipeThresholdRatio !== DRAG_SETTINGS_CONFIG.SWIPE_THRESHOLD_RATIO) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.SWIPE_THRESHOLD_RATIO",
      provided: DRAG_SETTINGS_CONFIG.SWIPE_THRESHOLD_RATIO,
      normalized: swipeThresholdRatio,
      reason: "expected a finite non-negative value",
    });
  }

  return corrections;
};

const collectDragDurationRampCorrections = (): DevNoticeEntry[] => {
  const velocityThreshold = normalizeNonNegativeNumber(
    DRAG_DURATION_RAMP_CONFIG.velocityThreshold,
    HARD_DRAG_DURATION_RAMP_SETTINGS.velocityThreshold,
  );
  const normalizedRampEnd = normalizeNonNegativeNumber(
    DRAG_DURATION_RAMP_CONFIG.rampEnd,
    HARD_DRAG_DURATION_RAMP_SETTINGS.rampEnd,
  );
  const rampEnd = Math.max(velocityThreshold, normalizedRampEnd);
  const minDurationRatio = normalizeDragDurationRatio(
    DRAG_DURATION_RAMP_CONFIG.minDurationRatio,
    HARD_DRAG_DURATION_RAMP_SETTINGS.minDurationRatio,
  );
  const minDuration = normalizePositiveDuration(
    DRAG_DURATION_RAMP_CONFIG.minDuration,
    HARD_DRAG_DURATION_RAMP_SETTINGS.minDuration,
  );
  const inertiaBoost = normalizeNonNegativeNumber(
    DRAG_DURATION_RAMP_CONFIG.inertiaBoost,
    HARD_DRAG_DURATION_RAMP_SETTINGS.inertiaBoost,
  );
  const corrections: DevNoticeEntry[] = [];

  if (velocityThreshold !== DRAG_DURATION_RAMP_CONFIG.velocityThreshold) {
    corrections.push({
      field: "DRAG_DURATION_RAMP_CONFIG.velocityThreshold",
      provided: DRAG_DURATION_RAMP_CONFIG.velocityThreshold,
      normalized: velocityThreshold,
      reason: "expected a finite non-negative value",
    });
  }

  if (rampEnd !== DRAG_DURATION_RAMP_CONFIG.rampEnd) {
    corrections.push({
      field: "DRAG_DURATION_RAMP_CONFIG.rampEnd",
      provided: DRAG_DURATION_RAMP_CONFIG.rampEnd,
      normalized: rampEnd,
      reason: joinReasons(
        normalizedRampEnd !== DRAG_DURATION_RAMP_CONFIG.rampEnd
          ? "expected a finite non-negative value"
          : undefined,
        rampEnd !== normalizedRampEnd
          ? "must be greater than or equal to velocityThreshold"
          : undefined,
      ),
    });
  }

  if (minDurationRatio !== DRAG_DURATION_RAMP_CONFIG.minDurationRatio) {
    corrections.push({
      field: "DRAG_DURATION_RAMP_CONFIG.minDurationRatio",
      provided: DRAG_DURATION_RAMP_CONFIG.minDurationRatio,
      normalized: minDurationRatio,
      reason: isFiniteNumber(DRAG_DURATION_RAMP_CONFIG.minDurationRatio)
        ? `clamped to [${MIN_DRAG_DURATION_RATIO}, ${MAX_DRAG_DURATION_RATIO}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (minDuration !== DRAG_DURATION_RAMP_CONFIG.minDuration) {
    corrections.push({
      field: "DRAG_DURATION_RAMP_CONFIG.minDuration",
      provided: DRAG_DURATION_RAMP_CONFIG.minDuration,
      normalized: minDuration,
      reason: "expected a finite positive duration",
    });
  }

  if (inertiaBoost !== DRAG_DURATION_RAMP_CONFIG.inertiaBoost) {
    corrections.push({
      field: "DRAG_DURATION_RAMP_CONFIG.inertiaBoost",
      provided: DRAG_DURATION_RAMP_CONFIG.inertiaBoost,
      normalized: inertiaBoost,
      reason: "expected a finite non-negative value",
    });
  }

  return corrections;
};

const collectMotionCorrections = (): DevNoticeEntry[] => {
  const monotonicSpeedFactor = normalizePositiveNumber(
    MOTION_MONOTONIC_SPEED_FACTOR,
    HARD_MOTION_SETTINGS.monotonicSpeedFactor,
  );
  const snapBackDuration = normalizePositiveDuration(
    SNAP_BACK_DURATION,
    HARD_MOTION_SETTINGS.snapBackDuration,
  );
  const corrections: DevNoticeEntry[] = [];

  if (monotonicSpeedFactor !== MOTION_MONOTONIC_SPEED_FACTOR) {
    corrections.push({
      field: "MOTION_MONOTONIC_SPEED_FACTOR",
      provided: MOTION_MONOTONIC_SPEED_FACTOR,
      normalized: monotonicSpeedFactor,
      reason: "expected a finite positive value",
    });
  }

  if (snapBackDuration !== SNAP_BACK_DURATION) {
    corrections.push({
      field: "SNAP_BACK_DURATION",
      provided: SNAP_BACK_DURATION,
      normalized: snapBackDuration,
      reason: "expected a finite positive duration",
    });
  }

  return corrections;
};

const INTERNAL_NORMALIZATION_NOTICE_ENTRIES = [
  ...collectDefaultSettingsCorrections(),
  ...collectRepeatedClickCorrections(),
  ...collectInteractionCorrections(),
  ...collectDragCorrections(),
  ...collectDragDurationRampCorrections(),
  ...collectMotionCorrections(),
];

const collectPropNormalizationCorrections = ({
  visibleSlidesNr,
  durationAutoplay,
  durationStep,
  durationJump,
  intervalAutoplay,
  errAltPlaceholder,
}: CarouselNormalizationNoticeInput): DevNoticeEntry[] => {
  const corrections: DevNoticeEntry[] = [];

  const hasVisibleSlidesProp = isValueProvided(visibleSlidesNr);
  const visibleSlidesSource = hasVisibleSlidesProp
    ? visibleSlidesNr
    : SAFE_DEFAULT_SETTINGS.visibleSlidesNr;
  const visibleSlidesCount = normalizeVisibleSlidesCount(
    visibleSlidesSource,
    SAFE_DEFAULT_SETTINGS.visibleSlidesNr,
  );

  if (!Object.is(visibleSlidesCount, visibleSlidesSource)) {
    corrections.push({
      field: getCorrectionFieldName("visibleSlidesNr", hasVisibleSlidesProp),
      provided: visibleSlidesSource,
      normalized: visibleSlidesCount,
      reason: getPositiveIntegerReason(visibleSlidesSource),
    });
  }

  const hasAutoplayDurationProp = isValueProvided(durationAutoplay);
  const autoplayDurationSource = hasAutoplayDurationProp
    ? durationAutoplay
    : SAFE_DEFAULT_SETTINGS.durationAutoplay;
  const autoplayDurationValue = normalizePositiveDuration(
    autoplayDurationSource,
    SAFE_DEFAULT_SETTINGS.durationAutoplay,
  );

  if (!Object.is(autoplayDurationValue, autoplayDurationSource)) {
    corrections.push({
      field: getCorrectionFieldName(
        "durationAutoplay",
        hasAutoplayDurationProp,
      ),
      provided: autoplayDurationSource,
      normalized: autoplayDurationValue,
      reason: getPositiveDurationReason(autoplayDurationSource),
    });
  }

  const hasStepDurationProp = isValueProvided(durationStep);
  const stepDurationSource = hasStepDurationProp
    ? durationStep
    : SAFE_DEFAULT_SETTINGS.durationStep;
  const normalizedStepDuration = normalizePositiveDuration(
    stepDurationSource,
    SAFE_DEFAULT_SETTINGS.durationStep,
  );
  const stepDurationValue = Math.min(
    autoplayDurationValue,
    normalizedStepDuration,
  );

  if (!Object.is(stepDurationValue, stepDurationSource)) {
    corrections.push({
      field: getCorrectionFieldName("durationStep", hasStepDurationProp),
      provided: stepDurationSource,
      normalized: stepDurationValue,
      reason: joinReasons(
        getPositiveDurationReason(stepDurationSource),
        stepDurationValue !== normalizedStepDuration
          ? "capped to autoplayDuration"
          : undefined,
      ),
    });
  }

  const hasJumpDurationProp = isValueProvided(durationJump);
  const jumpDurationSource = hasJumpDurationProp
    ? durationJump
    : SAFE_DEFAULT_SETTINGS.durationJump;
  const normalizedJumpDuration = normalizePositiveDuration(
    jumpDurationSource,
    SAFE_DEFAULT_SETTINGS.durationJump,
  );
  const jumpDurationValue = Math.min(stepDurationValue, normalizedJumpDuration);

  if (!Object.is(jumpDurationValue, jumpDurationSource)) {
    corrections.push({
      field: getCorrectionFieldName("durationJump", hasJumpDurationProp),
      provided: jumpDurationSource,
      normalized: jumpDurationValue,
      reason: joinReasons(
        getPositiveDurationReason(jumpDurationSource),
        jumpDurationValue !== normalizedJumpDuration
          ? "capped to durationStep"
          : undefined,
      ),
    });
  }

  const hasAutoplayIntervalProp = isValueProvided(intervalAutoplay);
  const autoplayIntervalSource = hasAutoplayIntervalProp
    ? intervalAutoplay
    : SAFE_DEFAULT_SETTINGS.intervalAutoplay;
  const autoplayIntervalValue = normalizeAutoplayInterval(
    autoplayIntervalSource,
    SAFE_DEFAULT_SETTINGS.intervalAutoplay,
  );

  if (!Object.is(autoplayIntervalValue, autoplayIntervalSource)) {
    corrections.push({
      field: getCorrectionFieldName(
        "intervalAutoplay",
        hasAutoplayIntervalProp,
      ),
      provided: autoplayIntervalSource,
      normalized: autoplayIntervalValue,
      reason: getSafeAutoplayIntervalReason(autoplayIntervalSource),
    });
  }

  const hasErrorAltPlaceholderProp = isValueProvided(errAltPlaceholder);
  const errorAltPlaceholderSource = hasErrorAltPlaceholderProp
    ? errAltPlaceholder
    : DEFAULT_SETTINGS.errAltPlaceholder;
  const errorAltPlaceholderValue = normalizeErrorAltPlaceholder(
    errorAltPlaceholderSource,
    DEFAULT_SETTINGS.errAltPlaceholder,
  );

  if (!Object.is(errorAltPlaceholderValue, errorAltPlaceholderSource)) {
    corrections.push({
      field: getCorrectionFieldName(
        "errAltPlaceholder",
        hasErrorAltPlaceholderProp,
      ),
      provided: errorAltPlaceholderSource,
      normalized: errorAltPlaceholderValue,
      reason: getNonEmptyStringReason(errorAltPlaceholderSource),
    });
  }

  return corrections;
};

export const collectCarouselNormalizationNoticeEntries = (
  props: CarouselNormalizationNoticeInput,
): DevNoticeEntry[] => [
  ...INTERNAL_NORMALIZATION_NOTICE_ENTRIES,
  ...collectPropNormalizationCorrections(props),
];
