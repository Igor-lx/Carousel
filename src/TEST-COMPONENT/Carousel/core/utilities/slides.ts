import type { SlideA11yProps } from "./types";

export const getSlideVisibility = (
  virtualIndex: number,
  currentVirtualIndex: number,
  previousVirtualIndex: number,
  clampedVisible: number,
  isAnimating: boolean,
) => {
  const isActual =
    virtualIndex >= currentVirtualIndex &&
    virtualIndex < currentVirtualIndex + clampedVisible;

  if (isAnimating) {
    const startIndex = Math.floor(previousVirtualIndex);
    const wasVisible =
      virtualIndex >= startIndex &&
      virtualIndex < Math.ceil(previousVirtualIndex + clampedVisible);

    return { isActual, isActive: isActual || wasVisible };
  }

  return { isActual, isActive: isActual };
};

export const getSlideA11yProps = (
  metadata: { slideIndex: number },
  isActual: boolean,
  totalSlides: number,
): SlideA11yProps => ({
  role: "group",
  "aria-roledescription": "slide",
  "aria-label": `${metadata.slideIndex + 1} of ${totalSlides}`,
  ...(isActual && { "aria-current": "step" as const }),
});
