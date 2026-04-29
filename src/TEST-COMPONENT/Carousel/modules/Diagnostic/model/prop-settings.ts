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
  formatDiagnosticValue,
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

type PropFallbackSource =
  | "resolved-default-prop"
  | "diagnostic-safe-default";

const getPropFallbackReason = (
  fallbackValue: unknown,
  unit: string | undefined,
  fallbackSource: PropFallbackSource,
) =>
  fallbackSource === "resolved-default-prop"
    ? `Replaced with resolved default prop value: ${formatDiagnosticValue(
        fallbackValue,
        unit,
      )}`
    : `Replaced with diagnostic safe-default constant: ${formatDiagnosticValue(
        fallbackValue,
        unit,
      )}`;

const getAutoplayDurationReason = ({
  source,
  normalizedAutoplayDuration,
  reconciledAutoplayDuration,
  stepDuration,
  fallbackDuration,
  fallbackSource,
}: {
  source: unknown;
  normalizedAutoplayDuration: number;
  reconciledAutoplayDuration: number;
  stepDuration: number;
  fallbackDuration: number;
  fallbackSource: PropFallbackSource;
}) =>
  joinReasons(
    getPositiveDurationReason(source),
    (!isFiniteNumber(source) || source <= 0)
      ? getPropFallbackReason(
          fallbackDuration,
          DURATION_UNIT,
          fallbackSource,
        )
      : undefined,
    reconciledAutoplayDuration > normalizedAutoplayDuration &&
      reconciledAutoplayDuration === stepDuration
      ? `Raised to match durationStep: ${stepDuration}${DURATION_UNIT} so autoplay is not faster than step motion`
      : undefined,
  );

const getSafeAutoplayIntervalReason = (
  value: unknown,
  fallbackInterval: number,
  fallbackSource: PropFallbackSource,
) =>
  joinReasons(
    !isFiniteNumber(value) || value <= 0
      ? "Expected a positive interval"
      : undefined,
    !isFiniteNumber(value) || value <= 0
      ? getPropFallbackReason(
          fallbackInterval,
          DURATION_UNIT,
          fallbackSource,
        )
      : undefined,
    isFiniteNumber(value) && value > 0 && value < MIN_AUTOPLAY_INTERVAL
      ? `Raised to minimum timer interval: ${MIN_AUTOPLAY_INTERVAL}${DURATION_UNIT} to keep autoplay timers valid`
      : undefined,
  );

const getStepDurationReason = ({
  source,
  normalizedStepDuration,
  reconciledStepDuration,
  fallbackDuration,
  fallbackSource,
}: {
  source: unknown;
  normalizedStepDuration: number;
  reconciledStepDuration: number;
  fallbackDuration: number;
  fallbackSource: PropFallbackSource;
}) =>
  joinReasons(
    getPositiveDurationReason(source),
    (!isFiniteNumber(source) || source <= 0)
      ? getPropFallbackReason(
          fallbackDuration,
          DURATION_UNIT,
          fallbackSource,
        )
      : undefined,
    reconciledStepDuration > normalizedStepDuration
      ? `Raised to match durationJump: ${reconciledStepDuration}${DURATION_UNIT} so step motion is not faster than jump motion`
      : undefined,
  );

const getVisibleSlidesCountReason = (
  value: unknown,
  fallbackValue: number,
  minVisibleSlides: number,
  fallbackSource: PropFallbackSource,
) =>
  joinReasons(
    getPositiveIntegerReason(value),
    (!isFiniteNumber(value) || value <= 0)
      ? getPropFallbackReason(fallbackValue, undefined, fallbackSource)
      : undefined,
    isFiniteNumber(value) &&
      value > 0 &&
      Math.floor(value) < minVisibleSlides
      ? `Raised to minimum layout-safe value: ${minVisibleSlides} to keep page math valid`
      : undefined,
  );

const getPositiveDurationNormalizationReason = (
  value: unknown,
  fallbackDuration: number,
  fallbackSource: PropFallbackSource,
) =>
  joinReasons(
    getPositiveDurationReason(value),
    (!isFiniteNumber(value) || value <= 0)
      ? getPropFallbackReason(
          fallbackDuration,
          DURATION_UNIT,
          fallbackSource,
        )
      : undefined,
  );

const getErrorAltPlaceholderReason = (
  value: unknown,
  normalizedPlaceholder: string,
  fallbackSource: PropFallbackSource,
) =>
  joinReasons(
    getNonEmptyStringReason(value),
    typeof value === "string" && value.trim()
      ? undefined
      : getPropFallbackReason(
          normalizedPlaceholder,
          undefined,
          fallbackSource,
        ),
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
  `durationJump is unusually high: ${jumpDuration}${DURATION_UNIT}. ` +
  `Expected at most ${MAX_REASONABLE_JUMP_DURATION}${DURATION_UNIT}. ` +
  `Motion is still valid, but durationStep resolved to ${stepDuration}${DURATION_UNIT} ` +
  `and durationAutoplay resolved to ${autoplayDuration}${DURATION_UNIT} to preserve timing order.`;

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
  fallbackSource: PropFallbackSource = "resolved-default-prop",
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
        fallbackSettings.visibleSlidesCount,
        minVisibleSlides,
        fallbackSource,
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
        fallbackDuration: fallbackSettings.autoplayDuration,
        fallbackSource,
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
        fallbackDuration: fallbackSettings.stepDuration,
        fallbackSource,
      }),
    });
  }

  if (!Object.is(jumpDuration, jumpDurationSource)) {
    corrections.push({
      field: fieldNames.durationJump,
      provided: jumpDurationSource,
      normalized: jumpDuration,
      unit: DURATION_UNIT,
      reason: getPositiveDurationNormalizationReason(
        jumpDurationSource,
        fallbackSettings.jumpDuration,
        fallbackSource,
      ),
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
      reason: getSafeAutoplayIntervalReason(
        autoplayIntervalSource,
        fallbackSettings.autoplayInterval,
        fallbackSource,
      ),
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
      reason: getErrorAltPlaceholderReason(
        errorAltPlaceholderSource,
        errorAltPlaceholder,
        fallbackSource,
      ),
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
    "diagnostic-safe-default",
  );
