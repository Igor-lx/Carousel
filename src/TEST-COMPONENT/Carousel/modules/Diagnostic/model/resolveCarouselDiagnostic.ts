import type { DevNoticeEntry } from "../../../../../shared";
import {
  AUTOPLAY_PAGINATION_FACTOR,
  DEFAULT_SETTINGS,
  DRAG_DURATION_RAMP_CONFIG,
  DRAG_SETTINGS_CONFIG,
  HOVER_PAUSE_DELAY,
  MIN_VISIBLE_SLIDES as RUNTIME_MIN_VISIBLE_SLIDES,
  MOTION_EPSILON,
  MOTION_MONOTONIC_SPEED_FACTOR,
  RENDER_WINDOW_BUFFER_MULTIPLIER,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_EPSILON,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  SNAP_BACK_DURATION,
  VISIBILITY_THRESHOLD,
} from "../../../core/model/config";
import type {
  CarouselDiagnosticPayload,
  CarouselDiagnosticPropsInput,
  CarouselRuntimePropSettings,
} from "../../../core/model/diagnostic";
import {
  HARD_DRAG_DURATION_RAMP_SETTINGS,
  HARD_DRAG_SETTINGS,
  HARD_ERROR_ALT_PLACEHOLDER,
  HARD_INTERACTION_SETTINGS,
  HARD_LAYOUT_SETTINGS,
  HARD_MOTION_SETTINGS,
  HARD_REPEATED_CLICK_SETTINGS,
  MAX_DRAG_DURATION_RATIO,
  MAX_DRAG_EMA_ALPHA,
  MAX_REASONABLE_JUMP_DURATION,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_VISIBILITY_THRESHOLD,
  MIN_AUTOPLAY_INTERVAL,
  MIN_DRAG_DURATION_RATIO,
  MIN_DRAG_EMA_ALPHA,
  MIN_RENDER_WINDOW_BUFFER_MULTIPLIER,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
  MIN_VISIBLE_SLIDES,
  MIN_VISIBILITY_THRESHOLD,
  SAFE_DURATION,
} from "./contracts";
import {
  isValueProvided,
  normalizeAutoplayInterval,
  normalizeAutoplayPaginationFactor,
  normalizeDragDurationRatio,
  normalizeDragEmaAlpha,
  normalizeErrorAltPlaceholder,
  normalizeNonNegativeNumber,
  normalizePositiveDuration,
  normalizePositiveInteger,
  normalizePositiveNumber,
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickSpeedMultiplier,
  normalizeVisibilityThreshold,
  normalizeVisibleSlidesCount,
} from "./helpers";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const DURATION_UNIT = "ms";

const joinReasons = (...reasons: Array<string | undefined>) => {
  const definedReasons = reasons.filter(Boolean);

  return definedReasons.length > 0 ? definedReasons.join("; ") : undefined;
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
    ? `expected a finite positive duration in ${DURATION_UNIT}`
    : undefined;

const getNonNegativeDurationReason = (value: unknown) =>
  !isFiniteNumber(value) || value < 0
    ? `expected a finite non-negative duration in ${DURATION_UNIT}`
    : undefined;

const getAutoplayDurationReason = ({
  source,
  normalizedAutoplayDuration,
  reconciledAutoplayDuration,
  stepDuration,
}: {
  source: unknown;
  normalizedAutoplayDuration: number;
  reconciledAutoplayDuration: number;
  stepDuration: number;
}) =>
  joinReasons(
    getPositiveDurationReason(source),
    reconciledAutoplayDuration > normalizedAutoplayDuration &&
    reconciledAutoplayDuration === stepDuration
      ? `raised to durationStep (${stepDuration}${DURATION_UNIT})`
      : undefined,
  );

const getSafeAutoplayIntervalReason = (value: unknown) =>
  !isFiniteNumber(value) || value < MIN_AUTOPLAY_INTERVAL
    ? `expected a finite interval of at least ${MIN_AUTOPLAY_INTERVAL}${DURATION_UNIT}`
    : undefined;

const getNonEmptyStringReason = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? undefined
    : "expected a non-empty string";

const getStepDurationReason = ({
  source,
  normalizedStepDuration,
  reconciledStepDuration,
}: {
  source: unknown;
  normalizedStepDuration: number;
  reconciledStepDuration: number;
}) =>
  joinReasons(
    getPositiveDurationReason(source),
    reconciledStepDuration > normalizedStepDuration
      ? `raised to durationJump (${reconciledStepDuration}${DURATION_UNIT})`
      : undefined,
  );

const getVisibleSlidesCountReason = (
  value: unknown,
  minVisibleSlides: number,
) =>
  joinReasons(
    getPositiveIntegerReason(value),
    isFiniteNumber(value) && value < minVisibleSlides
      ? `must be greater than or equal to minVisibleSlides (${minVisibleSlides})`
      : undefined,
  );

const getUnreasonablyHighJumpDurationMessage = ({
  jumpDuration,
  stepDuration,
  autoplayDuration,
}: {
  jumpDuration: number;
  stepDuration: number;
  autoplayDuration: number;
}) =>
  `durationJump exceeds reasonable UX threshold (${MAX_REASONABLE_JUMP_DURATION}${DURATION_UNIT}); ` +
  `this is not invalid, but it is higher than the expected visual/behavioral range. ` +
  `To preserve the invariant, durationStep resolved to ${stepDuration}${DURATION_UNIT} and ` +
  `durationAutoplay resolved to ${autoplayDuration}${DURATION_UNIT} together with durationJump=${jumpDuration}${DURATION_UNIT}, ` +
  `so the resulting motion may feel unexpectedly slow.`;

const createFallbackDefaultSettings = (
  minVisibleSlides: number,
): CarouselRuntimePropSettings => ({
  visibleSlidesCount: minVisibleSlides,
  autoplayDuration: SAFE_DURATION,
  stepDuration: SAFE_DURATION,
  jumpDuration: SAFE_DURATION,
  autoplayInterval: SAFE_DURATION,
  errorAltPlaceholder: HARD_ERROR_ALT_PLACEHOLDER,
});

const resolveRuntimePropSettings = (
  {
    visibleSlidesNr,
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  }: CarouselDiagnosticPropsInput,
  fallbackSettings: CarouselRuntimePropSettings,
  fieldNames: {
    visibleSlidesNr: string;
    durationAutoplay: string;
    durationStep: string;
    durationJump: string;
    intervalAutoplay: string;
    errAltPlaceholder: string;
  },
  minVisibleSlides: number,
) => {
  const corrections: DevNoticeEntry[] = [];

  const visibleSlidesSource = isValueProvided(visibleSlidesNr)
    ? visibleSlidesNr
    : fallbackSettings.visibleSlidesCount;
  const visibleSlidesCount = normalizeVisibleSlidesCount(
    visibleSlidesSource,
    fallbackSettings.visibleSlidesCount,
    minVisibleSlides,
  );

  if (!Object.is(visibleSlidesCount, visibleSlidesSource)) {
    corrections.push({
      field: fieldNames.visibleSlidesNr,
      provided: visibleSlidesSource,
      normalized: visibleSlidesCount,
      reason: getVisibleSlidesCountReason(
        visibleSlidesSource,
        minVisibleSlides,
      ),
    });
  }

  const autoplayDurationSource = isValueProvided(durationAutoplay)
    ? durationAutoplay
    : fallbackSettings.autoplayDuration;
  const normalizedAutoplayDuration = normalizePositiveDuration(
    autoplayDurationSource,
    fallbackSettings.autoplayDuration,
  );

  const stepDurationSource = isValueProvided(durationStep)
    ? durationStep
    : fallbackSettings.stepDuration;
  const normalizedStepDuration = normalizePositiveDuration(
    stepDurationSource,
    fallbackSettings.stepDuration,
  );

  const jumpDurationSource = isValueProvided(durationJump)
    ? durationJump
    : fallbackSettings.jumpDuration;
  const normalizedJumpDuration = normalizePositiveDuration(
    jumpDurationSource,
    fallbackSettings.jumpDuration,
  );

  const hasUnreasonablyHighJumpDuration =
    normalizedJumpDuration > MAX_REASONABLE_JUMP_DURATION;
  const stepDuration = Math.max(
    normalizedStepDuration,
    normalizedJumpDuration,
  );
  const autoplayDuration = Math.max(normalizedAutoplayDuration, stepDuration);
  const jumpDuration = normalizedJumpDuration;

  if (!Object.is(autoplayDuration, autoplayDurationSource)) {
    corrections.push({
      field: fieldNames.durationAutoplay,
      provided: autoplayDurationSource,
      normalized: autoplayDuration,
      unit: DURATION_UNIT,
      reason: getAutoplayDurationReason({
        source: autoplayDurationSource,
        normalizedAutoplayDuration,
        reconciledAutoplayDuration: autoplayDuration,
        stepDuration,
      }),
    });
  }

  if (!Object.is(stepDuration, stepDurationSource)) {
    corrections.push({
      field: fieldNames.durationStep,
      provided: stepDurationSource,
      normalized: stepDuration,
      unit: DURATION_UNIT,
      reason: getStepDurationReason({
        source: stepDurationSource,
        normalizedStepDuration,
        reconciledStepDuration: stepDuration,
      }),
    });
  }

  if (!Object.is(jumpDuration, jumpDurationSource)) {
    corrections.push({
      field: fieldNames.durationJump,
      provided: jumpDurationSource,
      normalized: jumpDuration,
      unit: DURATION_UNIT,
      reason: getPositiveDurationReason(jumpDurationSource),
    });
  }

  if (hasUnreasonablyHighJumpDuration) {
    corrections.push({
      field: fieldNames.durationJump,
      provided: jumpDurationSource,
      normalized: jumpDuration,
      message: getUnreasonablyHighJumpDurationMessage({
        jumpDuration,
        stepDuration,
        autoplayDuration,
      }),
    });
  }

  const autoplayIntervalSource = isValueProvided(intervalAutoplay)
    ? intervalAutoplay
    : fallbackSettings.autoplayInterval;
  const autoplayInterval = normalizeAutoplayInterval(
    autoplayIntervalSource,
    fallbackSettings.autoplayInterval,
  );

  if (!Object.is(autoplayInterval, autoplayIntervalSource)) {
    corrections.push({
      field: fieldNames.intervalAutoplay,
      provided: autoplayIntervalSource,
      normalized: autoplayInterval,
      unit: DURATION_UNIT,
      reason: getSafeAutoplayIntervalReason(autoplayIntervalSource),
    });
  }

  const errorAltPlaceholderSource = isValueProvided(errAltPlaceholder)
    ? errAltPlaceholder
    : fallbackSettings.errorAltPlaceholder;
  const errorAltPlaceholder = normalizeErrorAltPlaceholder(
    errorAltPlaceholderSource,
    fallbackSettings.errorAltPlaceholder,
  );

  if (!Object.is(errorAltPlaceholder, errorAltPlaceholderSource)) {
    corrections.push({
      field: fieldNames.errAltPlaceholder,
      provided: errorAltPlaceholderSource,
      normalized: errorAltPlaceholder,
      reason: getNonEmptyStringReason(errorAltPlaceholderSource),
    });
  }

  return {
    settings: {
      visibleSlidesCount,
      autoplayDuration,
      stepDuration,
      jumpDuration,
      autoplayInterval,
      errorAltPlaceholder,
    },
    corrections,
  };
};

const resolveLayoutSettings = () => {
  const minVisibleSlides = normalizePositiveInteger(
    RUNTIME_MIN_VISIBLE_SLIDES,
    HARD_LAYOUT_SETTINGS.minVisibleSlides,
    MIN_VISIBLE_SLIDES,
  );
  const renderWindowBufferMultiplier = normalizePositiveInteger(
    RENDER_WINDOW_BUFFER_MULTIPLIER,
    HARD_LAYOUT_SETTINGS.renderWindowBufferMultiplier,
    MIN_RENDER_WINDOW_BUFFER_MULTIPLIER,
  );
  const corrections: DevNoticeEntry[] = [];

  if (minVisibleSlides !== RUNTIME_MIN_VISIBLE_SLIDES) {
    corrections.push({
      field: "MIN_VISIBLE_SLIDES",
      provided: RUNTIME_MIN_VISIBLE_SLIDES,
      normalized: minVisibleSlides,
      reason: getPositiveIntegerReason(RUNTIME_MIN_VISIBLE_SLIDES),
    });
  }

  if (renderWindowBufferMultiplier !== RENDER_WINDOW_BUFFER_MULTIPLIER) {
    corrections.push({
      field: "RENDER_WINDOW_BUFFER_MULTIPLIER",
      provided: RENDER_WINDOW_BUFFER_MULTIPLIER,
      normalized: renderWindowBufferMultiplier,
      reason: getPositiveIntegerReason(RENDER_WINDOW_BUFFER_MULTIPLIER),
    });
  }

  return {
    settings: {
      minVisibleSlides,
      renderWindowBufferMultiplier,
    },
    corrections,
  };
};

const resolveDefaultPropSettings = (minVisibleSlides: number) =>
  resolveRuntimePropSettings(
    {
      visibleSlidesNr: DEFAULT_SETTINGS.visibleSlidesNr,
      durationAutoplay: DEFAULT_SETTINGS.durationAutoplay,
      durationStep: DEFAULT_SETTINGS.durationStep,
      durationJump: DEFAULT_SETTINGS.durationJump,
      intervalAutoplay: DEFAULT_SETTINGS.intervalAutoplay,
      errAltPlaceholder: DEFAULT_SETTINGS.errAltPlaceholder,
    },
    createFallbackDefaultSettings(minVisibleSlides),
    {
      visibleSlidesNr: "DEFAULT_SETTINGS.visibleSlidesNr",
      durationAutoplay: "DEFAULT_SETTINGS.durationAutoplay",
      durationStep: "DEFAULT_SETTINGS.durationStep",
      durationJump: "DEFAULT_SETTINGS.durationJump",
      intervalAutoplay: "DEFAULT_SETTINGS.intervalAutoplay",
      errAltPlaceholder: "DEFAULT_SETTINGS.errAltPlaceholder",
    },
    minVisibleSlides,
  );

const resolveRepeatedClickSettings = () => {
  const destinationPosition = normalizeRepeatedClickDestination(
    REPEATED_CLICK_DESTINATION_POSITION,
    HARD_REPEATED_CLICK_SETTINGS.destinationPosition,
  );
  const speedMultiplier = normalizeRepeatedClickSpeedMultiplier(
    REPEATED_CLICK_SPEED_MULTIPLIER,
    HARD_REPEATED_CLICK_SETTINGS.speedMultiplier,
  );
  const epsilon = normalizePositiveNumber(
    REPEATED_CLICK_EPSILON,
    HARD_REPEATED_CLICK_SETTINGS.epsilon,
  );
  const corrections: DevNoticeEntry[] = [];

  if (destinationPosition !== REPEATED_CLICK_DESTINATION_POSITION) {
    corrections.push({
      field: "REPEATED_CLICK_DESTINATION_POSITION",
      provided: REPEATED_CLICK_DESTINATION_POSITION,
      normalized: destinationPosition,
      reason: isFiniteNumber(REPEATED_CLICK_DESTINATION_POSITION)
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

  if (epsilon !== REPEATED_CLICK_EPSILON) {
    corrections.push({
      field: "REPEATED_CLICK_EPSILON",
      provided: REPEATED_CLICK_EPSILON,
      normalized: epsilon,
      reason: "expected a finite positive value",
    });
  }

  return {
    settings: {
      destinationPosition,
      speedMultiplier,
      epsilon,
    },
    corrections,
  };
};

const resolveInteractionSettings = () => {
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
      unit: DURATION_UNIT,
      reason: getNonNegativeDurationReason(HOVER_PAUSE_DELAY),
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

  return {
    settings: {
      hoverPauseDelay,
      visibilityThreshold,
      autoplayPaginationFactor,
    },
    corrections,
  };
};

const resolveDragSettings = () => {
  const cooldownMs = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.COOLDOWN_MS,
    HARD_DRAG_SETTINGS.COOLDOWN_MS,
  );
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
  const swipeVelocityLimit = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.SWIPE_VELOCITY_LIMIT,
    HARD_DRAG_SETTINGS.SWIPE_VELOCITY_LIMIT,
  );
  const quickSwipeMinOffset = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.QUICK_SWIPE_MIN_OFFSET,
    HARD_DRAG_SETTINGS.QUICK_SWIPE_MIN_OFFSET,
  );
  const minSwipeDistance = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.MIN_SWIPE_DISTANCE,
    HARD_DRAG_SETTINGS.MIN_SWIPE_DISTANCE,
  );
  const swipeThresholdRatio = normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.SWIPE_THRESHOLD_RATIO,
    HARD_DRAG_SETTINGS.SWIPE_THRESHOLD_RATIO,
  );
  const releaseEpsilon = normalizePositiveNumber(
    DRAG_SETTINGS_CONFIG.RELEASE_EPSILON,
    HARD_DRAG_SETTINGS.RELEASE_EPSILON,
  );
  const corrections: DevNoticeEntry[] = [];

  if (cooldownMs !== DRAG_SETTINGS_CONFIG.COOLDOWN_MS) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.COOLDOWN_MS",
      provided: DRAG_SETTINGS_CONFIG.COOLDOWN_MS,
      normalized: cooldownMs,
      unit: DURATION_UNIT,
      reason: getNonNegativeDurationReason(DRAG_SETTINGS_CONFIG.COOLDOWN_MS),
    });
  }

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

  if (swipeVelocityLimit !== DRAG_SETTINGS_CONFIG.SWIPE_VELOCITY_LIMIT) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.SWIPE_VELOCITY_LIMIT",
      provided: DRAG_SETTINGS_CONFIG.SWIPE_VELOCITY_LIMIT,
      normalized: swipeVelocityLimit,
      reason: "expected a finite non-negative value",
    });
  }

  if (quickSwipeMinOffset !== DRAG_SETTINGS_CONFIG.QUICK_SWIPE_MIN_OFFSET) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.QUICK_SWIPE_MIN_OFFSET",
      provided: DRAG_SETTINGS_CONFIG.QUICK_SWIPE_MIN_OFFSET,
      normalized: quickSwipeMinOffset,
      reason: "expected a finite non-negative value",
    });
  }

  if (minSwipeDistance !== DRAG_SETTINGS_CONFIG.MIN_SWIPE_DISTANCE) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.MIN_SWIPE_DISTANCE",
      provided: DRAG_SETTINGS_CONFIG.MIN_SWIPE_DISTANCE,
      normalized: minSwipeDistance,
      reason: "expected a finite non-negative value",
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

  if (releaseEpsilon !== DRAG_SETTINGS_CONFIG.RELEASE_EPSILON) {
    corrections.push({
      field: "DRAG_SETTINGS_CONFIG.RELEASE_EPSILON",
      provided: DRAG_SETTINGS_CONFIG.RELEASE_EPSILON,
      normalized: releaseEpsilon,
      reason: "expected a finite positive value",
    });
  }

  return {
    settings: {
      COOLDOWN_MS: cooldownMs,
      INTENT_THRESHOLD: intentThreshold,
      RESISTANCE: resistance,
      RESISTANCE_CURVATURE: resistanceCurvature,
      MAX_VELOCITY: maxVelocity,
      EMA_ALPHA: emaAlpha,
      SWIPE_VELOCITY_LIMIT: swipeVelocityLimit,
      QUICK_SWIPE_MIN_OFFSET: quickSwipeMinOffset,
      MIN_SWIPE_DISTANCE: minSwipeDistance,
      SWIPE_THRESHOLD_RATIO: swipeThresholdRatio,
      RELEASE_EPSILON: releaseEpsilon,
    },
    corrections,
  };
};

const resolveDragDurationRampSettings = () => {
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
      unit: DURATION_UNIT,
      reason: getPositiveDurationReason(DRAG_DURATION_RAMP_CONFIG.minDuration),
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

  return {
    settings: {
      velocityThreshold,
      rampEnd,
      minDurationRatio,
      minDuration,
      inertiaBoost,
    },
    corrections,
  };
};

const resolveMotionSettings = () => {
  const monotonicSpeedFactor = normalizePositiveNumber(
    MOTION_MONOTONIC_SPEED_FACTOR,
    HARD_MOTION_SETTINGS.monotonicSpeedFactor,
  );
  const snapBackDuration = normalizePositiveDuration(
    SNAP_BACK_DURATION,
    HARD_MOTION_SETTINGS.snapBackDuration,
  );
  const epsilon = normalizePositiveNumber(
    MOTION_EPSILON,
    HARD_MOTION_SETTINGS.epsilon,
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
      unit: DURATION_UNIT,
      reason: getPositiveDurationReason(SNAP_BACK_DURATION),
    });
  }

  if (epsilon !== MOTION_EPSILON) {
    corrections.push({
      field: "MOTION_EPSILON",
      provided: MOTION_EPSILON,
      normalized: epsilon,
      reason: "expected a finite positive value",
    });
  }

  return {
    settings: {
      monotonicSpeedFactor,
      snapBackDuration,
      epsilon,
    },
    corrections,
  };
};

export const resolveCarouselDiagnostic = (
  props: CarouselDiagnosticPropsInput,
): CarouselDiagnosticPayload => {
  const layoutResolution = resolveLayoutSettings();
  const defaultPropResolution = resolveDefaultPropSettings(
    layoutResolution.settings.minVisibleSlides,
  );
  const repeatedClickResolution = resolveRepeatedClickSettings();
  const interactionResolution = resolveInteractionSettings();
  const dragResolution = resolveDragSettings();
  const dragDurationRampResolution = resolveDragDurationRampSettings();
  const motionResolution = resolveMotionSettings();
  const propResolution = resolveRuntimePropSettings(
    props,
    defaultPropResolution.settings,
    {
      visibleSlidesNr: "visibleSlidesNr",
      durationAutoplay: "durationAutoplay",
      durationStep: "durationStep",
      durationJump: "durationJump",
      intervalAutoplay: "intervalAutoplay",
      errAltPlaceholder: "errAltPlaceholder",
    },
    layoutResolution.settings.minVisibleSlides,
  );

  return {
    settings: {
      ...propResolution.settings,
      layoutSettings: layoutResolution.settings,
      repeatedClickSettings: repeatedClickResolution.settings,
      interactionSettings: interactionResolution.settings,
      dragSettings: dragResolution.settings,
      dragDurationRampSettings: dragDurationRampResolution.settings,
      motionSettings: motionResolution.settings,
    },
    correctionEntries: [
      ...layoutResolution.corrections,
      ...defaultPropResolution.corrections,
      ...repeatedClickResolution.corrections,
      ...interactionResolution.corrections,
      ...dragResolution.corrections,
      ...dragDurationRampResolution.corrections,
      ...motionResolution.corrections,
      ...propResolution.corrections,
    ],
  };
};
