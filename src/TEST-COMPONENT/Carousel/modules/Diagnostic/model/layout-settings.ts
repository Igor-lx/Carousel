import type { DevNoticeEntry } from "../../../../../shared";
import {
  RENDER_WINDOW_BUFFER_MULTIPLIER,
} from "../../../core/model/config";
import {
  MIN_RENDER_WINDOW_BUFFER_MULTIPLIER,
} from "./constraints";
import {
  getInternalConstantNoticeMessage,
  isPositiveIntegerAtLeast,
} from "./diagnostic-validation";

export const resolveLayoutSettings = () => {
  const renderWindowBufferMultiplier = RENDER_WINDOW_BUFFER_MULTIPLIER;
  const corrections: DevNoticeEntry[] = [];

  if (
    !isPositiveIntegerAtLeast(
      RENDER_WINDOW_BUFFER_MULTIPLIER,
      MIN_RENDER_WINDOW_BUFFER_MULTIPLIER,
    )
  ) {
    corrections.push({
      field: "RENDER_WINDOW_BUFFER_MULTIPLIER",
      provided: RENDER_WINDOW_BUFFER_MULTIPLIER,
      message: getInternalConstantNoticeMessage(
        `expected an integer greater than or equal to ${MIN_RENDER_WINDOW_BUFFER_MULTIPLIER}`,
      ),
    });
  }

  return {
    settings: {
      renderWindowBufferMultiplier,
    },
    corrections,
  };
};
