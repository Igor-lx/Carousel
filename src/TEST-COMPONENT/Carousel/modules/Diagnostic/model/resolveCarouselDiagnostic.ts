import type { DevNoticeEntry } from "../../../../../shared";
import {
  AUTOPLAY_PAGINATION_FACTOR,
  CAROUSEL_DRAG_CONFIG,
  CAROUSEL_DRAG_RELEASE_EPSILON,
  CAROUSEL_DRAG_SPEED_CONFIG,
  DEFAULT_SETTINGS,
  HOVER_PAUSE_DELAY,
  MIN_VISIBLE_SLIDES as RUNTIME_MIN_VISIBLE_SLIDES,
  MOTION_EPSILON,
  RENDER_WINDOW_BUFFER_MULTIPLIER,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_END_DECELERATION,
  REPEATED_CLICK_EPSILON,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  REPEATED_CLICK_START_ACCELERATION,
  SNAP_BACK_DURATION,
  VISIBILITY_THRESHOLD,
} from "../../../core/model/config";
import type {
  CarouselDiagnosticPayload,
  CarouselDiagnosticPropsInput,
  CarouselRuntimePropSettings,
} from "../../../core/model/diagnostic";
import {
  HARD_DRAG_CONFIG,
  HARD_DRAG_RELEASE_EPSILON,
  HARD_DRAG_SPEED_CONFIG,
  HARD_ERROR_ALT_PLACEHOLDER,
  HARD_INTERACTION_SETTINGS,
  HARD_LAYOUT_SETTINGS,
  HARD_MOTION_SETTINGS,
  HARD_REPEATED_CLICK_SETTINGS,
  MAX_DRAG_DURATION_RATIO,
  MAX_DRAG_EMA_ALPHA,
  MAX_REASONABLE_JUMP_DURATION,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_REPEATED_CLICK_PROFILE_SHARE,
  MAX_VISIBILITY_THRESHOLD,
  MIN_AUTOPLAY_INTERVAL,
  MIN_DRAG_DURATION_RATIO,
  MIN_DRAG_EMA_ALPHA,
  MIN_DRAG_INERTIA_BOOST,
  MIN_DRAG_INERTIA_BOOST_RAMP_END_RATIO,
  MIN_RENDER_WINDOW_BUFFER_MULTIPLIER,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_PROFILE_SHARE,
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
  normalizeDragInertiaBoost,
  normalizeDragInertiaBoostRampEndRatio,
  normalizeErrorAltPlaceholder,
  normalizeNonNegativeNumber,
  normalizePositiveDuration,
  normalizePositiveInteger,
  normalizePositiveNumber,
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickProfileShare,
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
  const startAcceleration = normalizeRepeatedClickProfileShare(
    REPEATED_CLICK_START_ACCELERATION,
    HARD_REPEATED_CLICK_SETTINGS.startAcceleration,
  );
  const endDeceleration = normalizeRepeatedClickProfileShare(
    REPEATED_CLICK_END_DECELERATION,
    HARD_REPEATED_CLICK_SETTINGS.endDeceleration,
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

  if (startAcceleration !== REPEATED_CLICK_START_ACCELERATION) {
    corrections.push({
      field: "REPEATED_CLICK_START_ACCELERATION",
      provided: REPEATED_CLICK_START_ACCELERATION,
      normalized: startAcceleration,
      reason: isFiniteNumber(REPEATED_CLICK_START_ACCELERATION)
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (endDeceleration !== REPEATED_CLICK_END_DECELERATION) {
    corrections.push({
      field: "REPEATED_CLICK_END_DECELERATION",
      provided: REPEATED_CLICK_END_DECELERATION,
      normalized: endDeceleration,
      reason: isFiniteNumber(REPEATED_CLICK_END_DECELERATION)
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
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
      startAcceleration,
      endDeceleration,
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

const resolveDragConfig = () => {
  const cooldownMs = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.COOLDOWN_MS,
    HARD_DRAG_CONFIG.COOLDOWN_MS,
  );
  const resistance = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.RESISTANCE,
    HARD_DRAG_CONFIG.RESISTANCE,
  );
  const resistanceCurvature = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE,
    HARD_DRAG_CONFIG.RESISTANCE_CURVATURE,
  );
  const intentThreshold = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD,
    HARD_DRAG_CONFIG.INTENT_THRESHOLD,
  );
  const maxVelocity = normalizePositiveNumber(
    CAROUSEL_DRAG_CONFIG.MAX_VELOCITY,
    HARD_DRAG_CONFIG.MAX_VELOCITY,
  );
  const emaAlpha = normalizeDragEmaAlpha(
    CAROUSEL_DRAG_CONFIG.EMA_ALPHA,
    HARD_DRAG_CONFIG.EMA_ALPHA,
  );
  const swipeVelocityLimit = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT,
    HARD_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT,
  );
  const quickSwipeMinOffset = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET,
    HARD_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET,
  );
  const minSwipeDistance = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE,
    HARD_DRAG_CONFIG.MIN_SWIPE_DISTANCE,
  );
  const swipeThresholdRatio = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
    HARD_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
  );
  const corrections: DevNoticeEntry[] = [];

  if (cooldownMs !== CAROUSEL_DRAG_CONFIG.COOLDOWN_MS) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.COOLDOWN_MS",
      provided: CAROUSEL_DRAG_CONFIG.COOLDOWN_MS,
      normalized: cooldownMs,
      unit: DURATION_UNIT,
      reason: getNonNegativeDurationReason(CAROUSEL_DRAG_CONFIG.COOLDOWN_MS),
    });
  }

  if (resistance !== CAROUSEL_DRAG_CONFIG.RESISTANCE) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.RESISTANCE",
      provided: CAROUSEL_DRAG_CONFIG.RESISTANCE,
      normalized: resistance,
      reason: "expected a finite non-negative value",
    });
  }

  if (resistanceCurvature !== CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE",
      provided: CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE,
      normalized: resistanceCurvature,
      reason: "expected a finite non-negative value",
    });
  }

  if (intentThreshold !== CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD",
      provided: CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD,
      normalized: intentThreshold,
      reason: "expected a finite non-negative value",
    });
  }

  if (maxVelocity !== CAROUSEL_DRAG_CONFIG.MAX_VELOCITY) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.MAX_VELOCITY",
      provided: CAROUSEL_DRAG_CONFIG.MAX_VELOCITY,
      normalized: maxVelocity,
      reason: "expected a finite positive value",
    });
  }

  if (emaAlpha !== CAROUSEL_DRAG_CONFIG.EMA_ALPHA) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.EMA_ALPHA",
      provided: CAROUSEL_DRAG_CONFIG.EMA_ALPHA,
      normalized: emaAlpha,
      reason: isFiniteNumber(CAROUSEL_DRAG_CONFIG.EMA_ALPHA)
        ? `clamped to [${MIN_DRAG_EMA_ALPHA}, ${MAX_DRAG_EMA_ALPHA}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (swipeVelocityLimit !== CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT",
      provided: CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT,
      normalized: swipeVelocityLimit,
      reason: "expected a finite non-negative value",
    });
  }

  if (quickSwipeMinOffset !== CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET",
      provided: CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET,
      normalized: quickSwipeMinOffset,
      reason: "expected a finite non-negative value",
    });
  }

  if (minSwipeDistance !== CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE",
      provided: CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE,
      normalized: minSwipeDistance,
      reason: "expected a finite non-negative value",
    });
  }

  if (swipeThresholdRatio !== CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO",
      provided: CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
      normalized: swipeThresholdRatio,
      reason: "expected a finite non-negative value",
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
    },
    corrections,
  };
};

const resolveDragSpeedConfig = () => {
  const inertiaBoostRampEndRatio = normalizeDragInertiaBoostRampEndRatio(
    CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoostRampEndRatio,
    HARD_DRAG_SPEED_CONFIG.inertiaBoostRampEndRatio,
  );
  const minDurationRatio = normalizeDragDurationRatio(
    CAROUSEL_DRAG_SPEED_CONFIG.minDurationRatio,
    HARD_DRAG_SPEED_CONFIG.minDurationRatio,
  );
  const minDuration = normalizePositiveDuration(
    CAROUSEL_DRAG_SPEED_CONFIG.minDuration,
    HARD_DRAG_SPEED_CONFIG.minDuration,
  );
  const inertiaBoost = normalizeDragInertiaBoost(
    CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost,
    HARD_DRAG_SPEED_CONFIG.inertiaBoost,
  );
  const releaseAccelerationDistanceShare = normalizeRepeatedClickProfileShare(
    CAROUSEL_DRAG_SPEED_CONFIG.releaseAccelerationDistanceShare,
    HARD_DRAG_SPEED_CONFIG.releaseAccelerationDistanceShare,
  );
  const releaseDecelerationDistanceShare = normalizeRepeatedClickProfileShare(
    CAROUSEL_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
    HARD_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
  );
  const corrections: DevNoticeEntry[] = [];

  if (
    inertiaBoostRampEndRatio !==
    CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoostRampEndRatio
  ) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoostRampEndRatio",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoostRampEndRatio,
      normalized: inertiaBoostRampEndRatio,
      reason: `expected a finite value greater than or equal to ${MIN_DRAG_INERTIA_BOOST_RAMP_END_RATIO}`,
    });
  }

  if (minDurationRatio !== CAROUSEL_DRAG_SPEED_CONFIG.minDurationRatio) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.minDurationRatio",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.minDurationRatio,
      normalized: minDurationRatio,
      reason: isFiniteNumber(CAROUSEL_DRAG_SPEED_CONFIG.minDurationRatio)
        ? `clamped to [${MIN_DRAG_DURATION_RATIO}, ${MAX_DRAG_DURATION_RATIO}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (minDuration !== CAROUSEL_DRAG_SPEED_CONFIG.minDuration) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.minDuration",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.minDuration,
      normalized: minDuration,
      unit: DURATION_UNIT,
      reason: getPositiveDurationReason(CAROUSEL_DRAG_SPEED_CONFIG.minDuration),
    });
  }

  if (inertiaBoost !== CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost,
      normalized: inertiaBoost,
      reason: `expected a finite value greater than or equal to ${MIN_DRAG_INERTIA_BOOST}`,
    });
  }

  if (
    releaseAccelerationDistanceShare !==
    CAROUSEL_DRAG_SPEED_CONFIG.releaseAccelerationDistanceShare
  ) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.releaseAccelerationDistanceShare",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.releaseAccelerationDistanceShare,
      normalized: releaseAccelerationDistanceShare,
      reason: isFiniteNumber(
        CAROUSEL_DRAG_SPEED_CONFIG.releaseAccelerationDistanceShare,
      )
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (
    releaseDecelerationDistanceShare !==
    CAROUSEL_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare
  ) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
      normalized: releaseDecelerationDistanceShare,
      reason: isFiniteNumber(
        CAROUSEL_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
      )
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  return {
    settings: {
      inertiaBoostRampEndRatio,
      minDurationRatio,
      minDuration,
      inertiaBoost,
      releaseAccelerationDistanceShare,
      releaseDecelerationDistanceShare,
    },
    corrections,
  };
};

const resolveDragReleaseEpsilon = () => {
  const dragReleaseEpsilon = normalizePositiveNumber(
    CAROUSEL_DRAG_RELEASE_EPSILON,
    HARD_DRAG_RELEASE_EPSILON,
  );
  const corrections: DevNoticeEntry[] = [];

  if (dragReleaseEpsilon !== CAROUSEL_DRAG_RELEASE_EPSILON) {
    corrections.push({
      field: "CAROUSEL_DRAG_RELEASE_EPSILON",
      provided: CAROUSEL_DRAG_RELEASE_EPSILON,
      normalized: dragReleaseEpsilon,
      reason: "expected a finite positive value",
    });
  }

  return {
    setting: dragReleaseEpsilon,
    corrections,
  };
};

const resolveMotionSettings = () => {
  const snapBackDuration = normalizePositiveDuration(
    SNAP_BACK_DURATION,
    HARD_MOTION_SETTINGS.snapBackDuration,
  );
  const epsilon = normalizePositiveNumber(
    MOTION_EPSILON,
    HARD_MOTION_SETTINGS.epsilon,
  );
  const corrections: DevNoticeEntry[] = [];

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
  const dragConfigResolution = resolveDragConfig();
  const dragSpeedConfigResolution = resolveDragSpeedConfig();
  const dragReleaseEpsilonResolution = resolveDragReleaseEpsilon();
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
      dragConfig: dragConfigResolution.settings,
      dragSpeedConfig: dragSpeedConfigResolution.settings,
      dragReleaseEpsilon: dragReleaseEpsilonResolution.setting,
      motionSettings: motionResolution.settings,
    },
    correctionEntries: [
      ...layoutResolution.corrections,
      ...defaultPropResolution.corrections,
      ...repeatedClickResolution.corrections,
      ...interactionResolution.corrections,
      ...dragConfigResolution.corrections,
      ...dragSpeedConfigResolution.corrections,
      ...dragReleaseEpsilonResolution.corrections,
      ...motionResolution.corrections,
      ...propResolution.corrections,
    ],
  };
};
