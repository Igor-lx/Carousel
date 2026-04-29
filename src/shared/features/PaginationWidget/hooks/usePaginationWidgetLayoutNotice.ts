import { useEffect } from "react";
import { PAGINATION_WIDGET_LIMITS } from "../model/paginationWidgetConstants";

interface WidgetNoticeProps {
  requestedVisibleDots: number;
  normalizedVisibleDots: number;
}

export function usePaginationWidgetLayoutNotice({
  requestedVisibleDots,
  normalizedVisibleDots,
}: WidgetNoticeProps): void {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    if (
      typeof requestedVisibleDots !== "number" ||
      !Number.isFinite(requestedVisibleDots)
    ) {
      console.warn(
        `[PaginationWidget]: Input "visibleDots" (${requestedVisibleDots}) is invalid. ` +
          `Expected a finite positive integer. ` +
          `Value was normalized to ${normalizedVisibleDots}.`,
      );
      return;
    }

    if (requestedVisibleDots < PAGINATION_WIDGET_LIMITS.minVisibleDots) {
      console.warn(
        `[PaginationWidget]: Input "visibleDots" (${requestedVisibleDots}) is too low. ` +
          `Minimum ${PAGINATION_WIDGET_LIMITS.minVisibleDots} dots are required for the animation engine to function. ` +
          `Value was normalized to ${normalizedVisibleDots}.`,
      );
      return;
    }

    if (requestedVisibleDots > PAGINATION_WIDGET_LIMITS.maxVisibleDots) {
      console.warn(
        `[PaginationWidget]: Input "visibleDots" (${requestedVisibleDots}) is too high. ` +
          `Maximum ${PAGINATION_WIDGET_LIMITS.maxVisibleDots} dots are allowed to keep layout work bounded. ` +
          `Value was normalized to ${normalizedVisibleDots}.`,
      );
      return;
    }

    if (!Number.isInteger(requestedVisibleDots)) {
      console.warn(
        `[PaginationWidget]: "visibleDots" must be a finite integer. ` +
          `Input (${requestedVisibleDots}) was normalized to ${normalizedVisibleDots}.`,
      );
      return;
    }

    if (requestedVisibleDots !== normalizedVisibleDots) {
      console.warn(
        `[PaginationWidget]: "visibleDots" must be an odd number. ` +
          `Input (${requestedVisibleDots}) was rounded up to ${normalizedVisibleDots}.`,
      );
    }
  }, [normalizedVisibleDots, requestedVisibleDots]);
}
