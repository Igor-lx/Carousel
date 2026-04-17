import { useMemo } from "react";
import { getSlideFlexStyle } from "../utilities";

interface TechStylesProps {
  size: number;
}

interface TechStylesResult {
  slideStyle: { flex: string };
}

export function useCarouselTechStyles({
  size,
}: TechStylesProps): TechStylesResult {
  const slideStyle = useMemo(() => getSlideFlexStyle(size), [size]);

  return {
    slideStyle,
  };
}
