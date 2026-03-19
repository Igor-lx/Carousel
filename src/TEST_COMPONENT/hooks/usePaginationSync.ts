import { useState, useEffect } from "react";

import {
  PAGINATION_DYNAMIC_DELAY_auto,
  PAGINATION_DYNAMIC_DELAY_step,
} from "../const";
import type { MoveReason } from "../types";

interface UsePaginationSyncProps {
  targetIndex: number;
  speed: number;
  conditions: MoveReason;
  isInstant: boolean;
}

export const usePaginationSync = ({
  targetIndex,
  speed,
  conditions,
  isInstant,
}: UsePaginationSyncProps) => {
  const [visualIndex, setVisualIndex] = useState(targetIndex);

  useEffect(() => {
    if (isInstant) {
      setVisualIndex(targetIndex);
      return;
    }

    const divisor =
      conditions === "autoplay"
        ? PAGINATION_DYNAMIC_DELAY_auto
        : PAGINATION_DYNAMIC_DELAY_step;

    const rawDelay = divisor > 0 ? speed / divisor : 0;
    const delay = Math.max(0, isFinite(rawDelay) ? rawDelay : 0);

    const timeout = setTimeout(() => {
      setVisualIndex(targetIndex);
    }, delay);

    return () => clearTimeout(timeout);
  }, [targetIndex, isInstant, speed, conditions]);

  return visualIndex;
};
