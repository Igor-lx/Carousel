import { useMemo, useCallback } from "react";
import type { DotWidgetState, PaginationWidgetConfig } from "./types";

export const useVisualPagination = (
  visibleDots: number,
  config: PaginationWidgetConfig,
  step: number,
) => {
  if (visibleDots % 2 === 0) {
    throw new Error("visibleDots must be an odd number");
  }

  const totalSlots = visibleDots + 2;
  const centerSlot = Math.floor(totalSlots / 2);
  const baseRadius = config.size / 2;

  const getScale = useCallback(
    (slot: number) => {
      if (slot <= 0 || slot >= visibleDots + 1) return 0;
      return Math.pow(0.65, Math.abs(slot - centerSlot));
    },
    [visibleDots, centerSlot],
  );


  const offsets = useMemo(() => {
    const arr = new Array(totalSlots).fill(0);

    for (let i = 1; i < totalSlots; i++) {
      arr[i] =
        arr[i - 1] +
        baseRadius * getScale(i - 1) +
        baseRadius * getScale(i) +
        config.gap;
    }

    return arr;
  }, [totalSlots, baseRadius, getScale, config.gap]);

  const getDotState = useCallback(
    (id: number): DotWidgetState => {
      const normalizedStep = ((step % totalSlots) + totalSlots) % totalSlots;

      const slot = (id - normalizedStep + totalSlots) % totalSlots;

      const scale = getScale(slot);

      const clampedSlot = Math.max(0, Math.min(totalSlots - 1, slot));
      const x = offsets[clampedSlot] - offsets[centerSlot];

      const isVisible = slot > 0 && slot < visibleDots + 1;

      return {
        id,
        x,
        scale,
        opacity: isVisible ? 1 : 0,
        isActive: slot === centerSlot,
      };
    },
    [step, totalSlots, offsets, centerSlot, visibleDots, getScale],
  );

  return { getDotState, totalSlots };
};
