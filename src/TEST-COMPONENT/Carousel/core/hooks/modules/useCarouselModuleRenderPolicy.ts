import { useMemo, type ReactNode } from "react";

interface UseCarouselModuleRenderPolicyProps {
  controlsSlot: ReactNode;
  paginationSlot: ReactNode;
  isControlsOn: boolean;
  isPaginationOn: boolean;
  canSlide: boolean;
}

interface UseCarouselModuleRenderPolicyResult {
  hasControlsSlot: boolean;
  hasPaginationSlot: boolean;
  shouldRenderControls: boolean;
  shouldRenderPagination: boolean;
}

export function useCarouselModuleRenderPolicy({
  controlsSlot,
  paginationSlot,
  isControlsOn,
  isPaginationOn,
  canSlide,
}: UseCarouselModuleRenderPolicyProps): UseCarouselModuleRenderPolicyResult {
  const hasControlsSlot = Boolean(controlsSlot);
  const hasPaginationSlot = Boolean(paginationSlot);

  return useMemo(
    () => ({
      hasControlsSlot,
      hasPaginationSlot,
      shouldRenderControls: isControlsOn && canSlide && hasControlsSlot,
      shouldRenderPagination: isPaginationOn && hasPaginationSlot,
    }),
    [
      canSlide,
      hasControlsSlot,
      hasPaginationSlot,
      isControlsOn,
      isPaginationOn,
    ],
  );
}
