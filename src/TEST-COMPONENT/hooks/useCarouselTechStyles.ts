import { useMemo } from "react";
import { getCarouselTransform, getSlideFlexStyle } from "../utilities";

interface TechStylesProps {
  current: number;
  windowStart: number;
  size: number;
  isDragging: boolean;
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
  isDragging,
  dragOffset,
}: TechStylesProps): TechStylesResult {
  const trackStyle = useMemo(() => {
    if (!isDragging) return undefined;

    const relativeIndex = current - windowStart;
    const transform = `${getCarouselTransform(relativeIndex, size)} translateX(${dragOffset}px)`;

    return {
      transform,
      transition: "none",
    };
  }, [current, windowStart, size, isDragging, dragOffset]);

  const slideStyle = useMemo(() => getSlideFlexStyle(size), [size]);

  return {
    trackStyle,
    slideStyle,
  };
}
