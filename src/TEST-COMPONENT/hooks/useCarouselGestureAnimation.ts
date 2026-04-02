import { type RefObject } from "react";
import { useIsomorphicLayoutEffect } from "../../shared";



interface GestureAnimationProps {
  readonly targetRef: RefObject<HTMLElement | null>;
  readonly isDragging: boolean;
  readonly getOffset: () => number;
  readonly isLocked: boolean;
  readonly isInstantMode: boolean;
}

export function useCarouselGestureAnimation({
  targetRef,
  isDragging,
  getOffset,
  isInstantMode,
}: GestureAnimationProps) {
  useIsomorphicLayoutEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    if (isInstantMode) {
      element.style.setProperty("--drag-offset", "0px");
      return;
    }

    if (isDragging) {
      let rafId: number;

      const sync = () => {
        element.style.setProperty("--drag-offset", `${getOffset()}px`);
        rafId = requestAnimationFrame(sync);
      };

      rafId = requestAnimationFrame(sync);
      return () => cancelAnimationFrame(rafId);
    }
    element.style.setProperty("--drag-offset", "0px");
  }, [isDragging, isInstantMode, getOffset, targetRef]);
}
