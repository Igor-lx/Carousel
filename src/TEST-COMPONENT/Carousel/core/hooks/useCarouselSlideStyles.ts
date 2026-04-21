import { useMemo } from "react";
import { getSlideFlexStyle } from "../utilities";

interface SlideStylesProps {
  visibleSlidesCount: number;
}

interface SlideStylesResult {
  slideStyle: { flex: string };
}

export function useCarouselSlideStyles({
  visibleSlidesCount,
}: SlideStylesProps): SlideStylesResult {
  const slideStyle = useMemo(
    () => getSlideFlexStyle(visibleSlidesCount),
    [visibleSlidesCount],
  );

  return {
    slideStyle,
  };
}
