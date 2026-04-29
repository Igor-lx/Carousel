import type { CarouselLayout } from "./types";
import { clamp, normalizePageIndex } from "./math";
import {
  getAlignedVirtualIndex,
  getNearestPageIndex,
  getPageStart,
} from "./layout";

type DragReleaseDirection = "LEFT" | "RIGHT" | "NONE";

interface ResolveCarouselDragReleaseTargetInput {
  releaseDirection: DragReleaseDirection;
  releasePosition: number;
  dragOriginPageIndex: number;
  layout: CarouselLayout;
}

interface CarouselDragReleaseTarget {
  targetPageIndex: number;
  targetVirtualIndex: number;
  isSnap: boolean;
}

export const resolveCarouselDragReleaseTarget = ({
  releaseDirection,
  releasePosition,
  dragOriginPageIndex,
  layout,
}: ResolveCarouselDragReleaseTargetInput): CarouselDragReleaseTarget => {
  const snapTargetPageIndex = getNearestPageIndex(releasePosition, layout);
  let targetPageIndex = snapTargetPageIndex;
  let isSnap = true;

  if (releaseDirection === "LEFT") {
    targetPageIndex = layout.isFinite
      ? clamp(dragOriginPageIndex + 1, 0, layout.pageCount - 1)
      : normalizePageIndex(dragOriginPageIndex + 1, layout.pageCount);
    isSnap = targetPageIndex === dragOriginPageIndex;
  } else if (releaseDirection === "RIGHT") {
    targetPageIndex = layout.isFinite
      ? clamp(dragOriginPageIndex - 1, 0, layout.pageCount - 1)
      : normalizePageIndex(dragOriginPageIndex - 1, layout.pageCount);
    isSnap = targetPageIndex === dragOriginPageIndex;
  }

  const targetVirtualIndex = layout.isFinite
    ? getPageStart(targetPageIndex, layout.visibleSlidesCount)
    : getAlignedVirtualIndex(targetPageIndex, releasePosition, layout);

  return {
    targetPageIndex,
    targetVirtualIndex,
    isSnap,
  };
};
