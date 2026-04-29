import type { DevNoticeEntry } from "../../../../../shared";
import { DEFAULT_SETTINGS } from "../../../core/model/config";
import type {
  CarouselDiagnosticPropsInput,
  CarouselRuntimePropSettings,
} from "../../../core/model/diagnostic";
import {
  DIAGNOSTIC_FALLBACK_ERROR_ALT_PLACEHOLDER,
  MAX_REASONABLE_JUMP_DURATION,
  MIN_AUTOPLAY_INTERVAL,
  MIN_VISIBLE_SLIDES,
  SAFE_DURATION,
} from "./constraints";
import {
  DURATION_UNIT,
  getNonEmptyStringReason,
  getPositiveDurationReason,
  getPositiveIntegerReason,
  isFiniteNumber,
  joinReasons,
} from "./diagnostic-validation";
import {
  isValueProvided,
  normalizeAutoplayInterval,
  normalizeErrorAltPlaceholder,
  normalizePositiveDuration,
  normalizeVisibleSlidesCount,
} from "./normalization";

interface RuntimePropDiagnosticFieldNames {
  visibleSlidesNr: string;
  durationAutoplay: string;
  durationStep: string;
  durationJump: string;
  intervalAutoplay: string;
  errAltPlaceholder: string;
}

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

const createDiagnosticPropFallbackSettings = (
  minVisibleSlides: number,
): CarouselRuntimePropSettings => ({
  visibleSlidesCount: minVisibleSlides,
  autoplayDuration: SAFE_DURATION,
  stepDuration: SAFE_DURATION,
  jumpDuration: SAFE_DURATION,
  autoplayInterval: SAFE_DURATION,
  errorAltPlaceholder: DIAGNOSTIC_FALLBACK_ERROR_ALT_PLACEHOLDER,
});

export const resolveRuntimePropSettings = (
  {
    visibleSlidesNr,
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  }: CarouselDiagnosticPropsInput,
  fallbackSettings: CarouselRuntimePropSettings,
  fieldNames: RuntimePropDiagnosticFieldNames,
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

export const resolveDefaultPropSettings = () =>
  resolveRuntimePropSettings(
    {
      visibleSlidesNr: DEFAULT_SETTINGS.visibleSlidesNr,
      durationAutoplay: DEFAULT_SETTINGS.durationAutoplay,
      durationStep: DEFAULT_SETTINGS.durationStep,
      durationJump: DEFAULT_SETTINGS.durationJump,
      intervalAutoplay: DEFAULT_SETTINGS.intervalAutoplay,
      errAltPlaceholder: DEFAULT_SETTINGS.errAltPlaceholder,
    },
    createDiagnosticPropFallbackSettings(MIN_VISIBLE_SLIDES),
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
