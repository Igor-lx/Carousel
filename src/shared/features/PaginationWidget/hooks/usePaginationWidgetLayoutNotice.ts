import { useEffect } from "react";

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

    if (requestedVisibleDots < 3) {
      console.warn(
        `[PaginationWidget]: Input "visibleDots" (${requestedVisibleDots}) is too low. ` +
          `Minimum 3 dots are required for the animation engine to function. ` +
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
