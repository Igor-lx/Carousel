import { useMemo } from "react";
import { getCarouselTransform, getSlideFlexStyle } from "../utilities";

interface TechStylesProps {
  current: number;
  windowStart: number;
  size: number;
  isInteractive: boolean;
  enabled: boolean;
  dragOffset: number;
}

interface TechStylesResult {
  trackStyle: React.CSSProperties | undefined;
  slideStyle: { flex: string };
}

export function useCarouselTechStyles({
  current,
  windowStart,
  size,
  isInteractive,
  enabled,
  dragOffset,
}: TechStylesProps): TechStylesResult {
  const trackStyle = useMemo(() => {
    if (!enabled) return undefined;

    const relativeIndex = current - windowStart;
    const transform = `${getCarouselTransform(relativeIndex, size)} translateX(${dragOffset}px)`;

    if (isInteractive) {
      return {
        transform,
        transition: "none",
      };
    }

    return {
      transform,
      transition: "none",
    };
  }, [current, windowStart, size, isInteractive, enabled, dragOffset]);

  const slideStyle = useMemo(() => getSlideFlexStyle(size), [size]);

  return {
    trackStyle,
    slideStyle,
  };
}
