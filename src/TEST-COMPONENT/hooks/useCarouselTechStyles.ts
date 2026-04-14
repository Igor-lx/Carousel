import { useMemo } from "react";
import {
  JUMP_BEZIER,
  SNAP_BACK_BEZIER,
  SNAP_BACK_TIME,
  MOVE_SWIPE_BEZIER,
  MOVE_AUTO_BEZIER,
  MOVE_CLICK_BEZIER,
} from "../model/constants";
import type { AnimationMode, MoveReason } from "../model/reducer";
import { getCarouselTransform, getSlideFlexStyle } from "../utilities";

interface TechStylesProps {
  current: number;
  windowStart: number;
  size: number;
  animMode: AnimationMode;
  isInteractive: boolean;
  duration: number;
  enabled: boolean;
  reason: MoveReason;
  dragOffset: number;
}

interface TechStylesResult {
  trackStyle: React.CSSProperties | undefined;
  slideStyle: { flex: string };
}

const getNormalModeBezier = (reason: MoveReason) => {
  if (reason === "gesture") return MOVE_SWIPE_BEZIER;
  if (reason === "autoplay") return MOVE_AUTO_BEZIER;
  return MOVE_CLICK_BEZIER;
};

export function useCarouselTechStyles({
  current,
  windowStart,
  size,
  animMode,
  isInteractive,
  duration,
  enabled,
  reason,
  dragOffset,
}: TechStylesProps): TechStylesResult {
  const trackStyle = useMemo(() => {
    if (!enabled) return undefined;

    const relativeIndex = current - windowStart;
    const transform = `${getCarouselTransform(relativeIndex, size)} translateX(${dragOffset}px)`;

    if (
      animMode === "none" ||
      animMode === "instant" ||
      animMode === "rebase" ||
      isInteractive
    ) {
      return {
        transform,
        transition: "none",
      };
    }

    let bezier: string;
    let currentDuration = duration;

    switch (animMode) {
      case "jump":
        bezier = JUMP_BEZIER;
        break;

      case "snap":
        bezier = SNAP_BACK_BEZIER;
        currentDuration = SNAP_BACK_TIME;
        break;

      case "normal":
      default:
        bezier = getNormalModeBezier(reason);
        break;
    }

    return {
      transform,
      transition: `transform ${currentDuration}ms ${bezier}`,
    };
  }, [
    current,
    windowStart,
    size,
    animMode,
    isInteractive,
    duration,
    enabled,
    reason,
    dragOffset,
  ]);

  const slideStyle = useMemo(() => getSlideFlexStyle(size), [size]);

  return {
    trackStyle,
    slideStyle,
  };
}
