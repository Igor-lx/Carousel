import type { AnimationMode, MoveReason } from "../reducer";

export const getDurationByVirtualSpan = ({
  from,
  to,
  stepSize,
  baseDuration,
}: {
  from: number;
  to: number;
  stepSize: number;
  baseDuration: number;
}) => {
  if (!(stepSize > 0)) {
    return baseDuration;
  }

  const stepSpan = Math.abs(to - from) / stepSize;

  return baseDuration * Math.max(0, stepSpan);
};

interface ResolveCarouselMotionDurationInput {
  reason: MoveReason;
  animMode: AnimationMode;
  isDragging: boolean;
  isInstant: boolean;
  gestureReleaseDuration: number;
  isRepeatedClickAdvance: boolean;
  segmentStartVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
  snapBackDuration: number;
  repeatedClickSpeedMultiplier: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
}

export const resolveCarouselMotionDuration = ({
  reason,
  animMode,
  isDragging,
  isInstant,
  gestureReleaseDuration,
  isRepeatedClickAdvance,
  segmentStartVirtualIndex,
  targetVirtualIndex,
  stepSize,
  snapBackDuration,
  repeatedClickSpeedMultiplier,
  autoplayDuration,
  stepDuration,
  jumpDuration,
}: ResolveCarouselMotionDurationInput): number => {
  const clickSegmentDuration = getDurationByVirtualSpan({
    from: segmentStartVirtualIndex,
    to: targetVirtualIndex,
    stepSize,
    baseDuration: stepDuration,
  });
  const repeatedClickAdvanceDuration =
    clickSegmentDuration /
    Math.max(1, repeatedClickSpeedMultiplier);

  const baseDuration = (() => {
    if (animMode === "snap") return snapBackDuration;

    if (isInstant || animMode === "jump") return jumpDuration;

    switch (reason) {
      case "click":
        if (isRepeatedClickAdvance) {
          return repeatedClickAdvanceDuration;
        }
        return clickSegmentDuration;
      case "autoplay":
        return autoplayDuration;
      case "gesture":
        return gestureReleaseDuration;
      default:
        return autoplayDuration;
    }
  })();

  if (isDragging) return 0;

  if (animMode === "snap") return baseDuration;

  if (isInstant || animMode === "jump") return jumpDuration;

  return baseDuration;
};
