import type { DevNoticeEntry } from "../../../../../shared";
import {
  AUTOPLAY_PAGINATION_FACTOR,
  CAROUSEL_DRAG_CONFIG,
  CAROUSEL_DRAG_RELEASE_EPSILON,
  CAROUSEL_DRAG_SPEED_CONFIG,
  DEFAULT_SETTINGS,
  HOVER_PAUSE_DELAY,
  MOTION_EPSILON,
  RENDER_WINDOW_BUFFER_MULTIPLIER,
  REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
  REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_EPSILON,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
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
  HARD_DRAG_SPEED_CONFIG,
  HARD_ERROR_ALT_PLACEHOLDER,
  HARD_INTERACTION_SETTINGS,
  HARD_MOTION_SETTINGS,
  HARD_REPEATED_CLICK_SETTINGS,
  MAX_DRAG_EMA_ALPHA,
  MAX_REASONABLE_JUMP_DURATION,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_REPEATED_CLICK_PROFILE_SHARE,
  MAX_VISIBILITY_THRESHOLD,
  MIN_AUTOPLAY_INTERVAL,
  MIN_DRAG_EMA_ALPHA,
  MIN_DRAG_INERTIA_BOOST,
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
  normalizeErrorAltPlaceholder,
  normalizeNonNegativeNumber,
  normalizePositiveDuration,
  normalizePositiveNumber,
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickProfileShare,
  normalizeVisibilityThreshold,
  normalizeVisibleSlidesCount,
} from "./helpers";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const DURATION_UNIT = "ms";
const OVERFLOW_PROFILE_DISTANCE_SHARES_NORMALIZED = {
  accelerationDistanceShare: 0.5,
  decelerationDistanceShare: 0.5,
} as const;

const getInternalConstantNoticeMessage = (reason: string) =>
  `${reason}; Diagnostic reports this internal constant but does not normalize runtime behavior`;

const isPositiveFiniteNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0;

const isNonNegativeFiniteNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0;

const isFiniteNumberInRange = (
  value: unknown,
  minValue: number,
  maxValue: number,
) =>
  isFiniteNumber(value) && value >= minValue && value <= maxValue;

const isPositiveIntegerAtLeast = (value: unknown, minValue: number) =>
  isFiniteNumber(value) && Number.isInteger(value) && value >= minValue;

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
  const renderWindowBufferMultiplier = RENDER_WINDOW_BUFFER_MULTIPLIER;
  const corrections: DevNoticeEntry[] = [];

  if (
    !isPositiveIntegerAtLeast(
      RENDER_WINDOW_BUFFER_MULTIPLIER,
      MIN_RENDER_WINDOW_BUFFER_MULTIPLIER,
    )
  ) {
    corrections.push({
      field: "RENDER_WINDOW_BUFFER_MULTIPLIER",
      provided: RENDER_WINDOW_BUFFER_MULTIPLIER,
      message: getInternalConstantNoticeMessage(
        `expected an integer greater than or equal to ${MIN_RENDER_WINDOW_BUFFER_MULTIPLIER}`,
      ),
    });
  }

  return {
    settings: {
      renderWindowBufferMultiplier,
    },
    corrections,
  };
};

const resolveDefaultPropSettings = () =>
  resolveRuntimePropSettings(
    {
      visibleSlidesNr: DEFAULT_SETTINGS.visibleSlidesNr,
      durationAutoplay: DEFAULT_SETTINGS.durationAutoplay,
      durationStep: DEFAULT_SETTINGS.durationStep,
      durationJump: DEFAULT_SETTINGS.durationJump,
      intervalAutoplay: DEFAULT_SETTINGS.intervalAutoplay,
      errAltPlaceholder: DEFAULT_SETTINGS.errAltPlaceholder,
    },
    createFallbackDefaultSettings(MIN_VISIBLE_SLIDES),
    {
      visibleSlidesNr: "DEFAULT_SETTINGS.visibleSlidesNr",
      durationAutoplay: "DEFAULT_SETTINGS.durationAutoplay",
      durationStep: "DEFAULT_SETTINGS.durationStep",
      durationJump: "DEFAULT_SETTINGS.durationJump",
      intervalAutoplay: "DEFAULT_SETTINGS.intervalAutoplay",
      errAltPlaceholder: "DEFAULT_SETTINGS.errAltPlaceholder",
    },
    MIN_VISIBLE_SLIDES,
  );

const resolveRepeatedClickSettings = () => {
  const destinationPosition = normalizeRepeatedClickDestination(
    REPEATED_CLICK_DESTINATION_POSITION,
    HARD_REPEATED_CLICK_SETTINGS.destinationPosition,
  );
  const touchDestinationPosition = normalizeRepeatedClickDestination(
    REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
    HARD_REPEATED_CLICK_SETTINGS.touchDestinationPosition,
  );
  const speedMultiplier = REPEATED_CLICK_SPEED_MULTIPLIER;
  const accelerationDistanceShare = normalizeRepeatedClickProfileShare(
    REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
    HARD_REPEATED_CLICK_SETTINGS.accelerationDistanceShare,
  );
  const decelerationDistanceShare = normalizeRepeatedClickProfileShare(
    REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
    HARD_REPEATED_CLICK_SETTINGS.decelerationDistanceShare,
  );
  const epsilon = REPEATED_CLICK_EPSILON;
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

  if (
    touchDestinationPosition !== REPEATED_CLICK_TOUCH_DESTINATION_POSITION
  ) {
    corrections.push({
      field: "REPEATED_CLICK_TOUCH_DESTINATION_POSITION",
      provided: REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
      normalized: touchDestinationPosition,
      reason: isFiniteNumber(REPEATED_CLICK_TOUCH_DESTINATION_POSITION)
        ? `clamped to [${MIN_REPEATED_CLICK_DESTINATION_POSITION}, ${MAX_REPEATED_CLICK_DESTINATION_POSITION}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (
    !isFiniteNumber(REPEATED_CLICK_SPEED_MULTIPLIER) ||
    REPEATED_CLICK_SPEED_MULTIPLIER < MIN_REPEATED_CLICK_SPEED_MULTIPLIER
  ) {
    corrections.push({
      field: "REPEATED_CLICK_SPEED_MULTIPLIER",
      provided: REPEATED_CLICK_SPEED_MULTIPLIER,
      message: getInternalConstantNoticeMessage(
        `expected a finite value greater than or equal to ${MIN_REPEATED_CLICK_SPEED_MULTIPLIER}`,
      ),
    });
  }

  if (
    accelerationDistanceShare !== REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE
  ) {
    corrections.push({
      field: "REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE",
      provided: REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
      normalized: accelerationDistanceShare,
      reason: isFiniteNumber(REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE)
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (
    decelerationDistanceShare !== REPEATED_CLICK_DECELERATION_DISTANCE_SHARE
  ) {
    corrections.push({
      field: "REPEATED_CLICK_DECELERATION_DISTANCE_SHARE",
      provided: REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
      normalized: decelerationDistanceShare,
      reason: isFiniteNumber(REPEATED_CLICK_DECELERATION_DISTANCE_SHARE)
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (accelerationDistanceShare + decelerationDistanceShare > 1) {
    corrections.push({
      field: "REPEATED_CLICK_PROFILE_DISTANCE_SHARES",
      provided: {
        accelerationDistanceShare,
        decelerationDistanceShare,
      },
      normalized: OVERFLOW_PROFILE_DISTANCE_SHARES_NORMALIZED,
      reason:
        "start + end distance shares exceed 1; runtime uses an even 50/50 acceleration/deceleration split with no cruise zone",
    });
  }

  if (!isPositiveFiniteNumber(REPEATED_CLICK_EPSILON)) {
    corrections.push({
      field: "REPEATED_CLICK_EPSILON",
      provided: REPEATED_CLICK_EPSILON,
      message: getInternalConstantNoticeMessage(
        "expected a finite positive value",
      ),
    });
  }

  return {
    settings: {
      destinationPosition,
      touchDestinationPosition,
      speedMultiplier,
      accelerationDistanceShare,
      decelerationDistanceShare,
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
  const resistance = CAROUSEL_DRAG_CONFIG.RESISTANCE;
  const resistanceCurvature = CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE;
  const intentThreshold = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD,
    HARD_DRAG_CONFIG.INTENT_THRESHOLD,
  );
  const maxVelocity = normalizePositiveNumber(
    CAROUSEL_DRAG_CONFIG.MAX_VELOCITY,
    HARD_DRAG_CONFIG.MAX_VELOCITY,
  );
  const emaAlpha = CAROUSEL_DRAG_CONFIG.EMA_ALPHA;
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

  if (!isFiniteNumberInRange(CAROUSEL_DRAG_CONFIG.RESISTANCE, 0, 1)) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.RESISTANCE",
      provided: CAROUSEL_DRAG_CONFIG.RESISTANCE,
      message: getInternalConstantNoticeMessage(
        "expected a finite value between 0 and 1",
      ),
    });
  }

  if (!isNonNegativeFiniteNumber(CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE)) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE",
      provided: CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE,
      message: getInternalConstantNoticeMessage(
        "expected a finite non-negative value",
      ),
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

  if (
    !isFiniteNumberInRange(
      CAROUSEL_DRAG_CONFIG.EMA_ALPHA,
      MIN_DRAG_EMA_ALPHA,
      MAX_DRAG_EMA_ALPHA,
    )
  ) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.EMA_ALPHA",
      provided: CAROUSEL_DRAG_CONFIG.EMA_ALPHA,
      message: getInternalConstantNoticeMessage(
        `expected a finite value between ${MIN_DRAG_EMA_ALPHA} and ${MAX_DRAG_EMA_ALPHA}`,
      ),
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
  const inertiaBoost = CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost;
  const releaseDecelerationDistanceShare = normalizeRepeatedClickProfileShare(
    CAROUSEL_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
    HARD_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
  );
  const corrections: DevNoticeEntry[] = [];

  if (
    !isFiniteNumber(CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost) ||
    CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost < MIN_DRAG_INERTIA_BOOST
  ) {
    corrections.push({
      field: "CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost",
      provided: CAROUSEL_DRAG_SPEED_CONFIG.inertiaBoost,
      message: getInternalConstantNoticeMessage(
        `expected a finite value greater than or equal to ${MIN_DRAG_INERTIA_BOOST}`,
      ),
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
      inertiaBoost,
      releaseDecelerationDistanceShare,
    },
    corrections,
  };
};

const resolveDragReleaseEpsilon = () => {
  const dragReleaseEpsilon = CAROUSEL_DRAG_RELEASE_EPSILON;
  const corrections: DevNoticeEntry[] = [];

  if (!isPositiveFiniteNumber(CAROUSEL_DRAG_RELEASE_EPSILON)) {
    corrections.push({
      field: "CAROUSEL_DRAG_RELEASE_EPSILON",
      provided: CAROUSEL_DRAG_RELEASE_EPSILON,
      message: getInternalConstantNoticeMessage(
        "expected a finite positive value",
      ),
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
  const epsilon = MOTION_EPSILON;
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

  if (!isPositiveFiniteNumber(MOTION_EPSILON)) {
    corrections.push({
      field: "MOTION_EPSILON",
      provided: MOTION_EPSILON,
      message: getInternalConstantNoticeMessage(
        "expected a finite positive value",
      ),
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
  const defaultPropResolution = resolveDefaultPropSettings();
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
    MIN_VISIBLE_SLIDES,
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
