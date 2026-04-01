import { useEffect } from "react";

interface WidgetNoticeProps {
  readonly visibleDots: number;
  readonly actualVisibleDots: number;
}

export function useLayoutNotice({
  visibleDots,
  actualVisibleDots,
}: WidgetNoticeProps): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    if (visibleDots < 3) {
      console.warn(
        `[PaginationWidget]: Input "visibleDots" (${visibleDots}) is too low. ` +
          `Minimum 3 dots are required for the animation engine to function. ` +
          `Value was forced to 3.`,
      );
      return;
    }

    if (visibleDots !== actualVisibleDots) {
      console.warn(
        `[PaginationWidget]: "visibleDots" must be an odd number. ` +
          `Input (${visibleDots}) was rounded up to ${actualVisibleDots}.`,
      );
    }
  }, [visibleDots, actualVisibleDots]);
}
