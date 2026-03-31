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

    if (visibleDots !== actualVisibleDots) {
      console.warn(
        `[PaginationWidget]: "visibleDots" must be an odd number. ` +
          `Input (${visibleDots}) was rounded up to ${actualVisibleDots}.`,
      );
    }

    if (actualVisibleDots < 3) {
      console.warn(
        `[PaginationWidget]: ${actualVisibleDots} dots is too few for animation. ` +
          `Consider using at least 3.`,
      );
    }
  }, [visibleDots, actualVisibleDots]);
}
