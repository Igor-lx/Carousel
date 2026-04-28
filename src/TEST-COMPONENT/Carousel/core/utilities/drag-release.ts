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
  dragReleaseEpsilon: number;
}

interface CarouselDragReleaseTarget {
  targetIndex: number;
  targetVirtualIndex: number;
  isSnap: boolean;
}

export const resolveCarouselDragReleaseTarget = ({
  releaseDirection,
  releasePosition,
  dragOriginPageIndex,
  layout,
  dragReleaseEpsilon,
}: ResolveCarouselDragReleaseTargetInput): CarouselDragReleaseTarget => {
  const snapTargetIndex = getNearestPageIndex(releasePosition, layout);
  let targetIndex = snapTargetIndex;
  let isSnap = true;

  if (releaseDirection === "LEFT") {
    targetIndex = layout.isFinite
      ? clamp(dragOriginPageIndex + 1, 0, layout.pageCount - 1)
      : normalizePageIndex(dragOriginPageIndex + 1, layout.pageCount);
    isSnap = targetIndex === dragOriginPageIndex;
  } else if (releaseDirection === "RIGHT") {
    targetIndex = layout.isFinite
      ? clamp(dragOriginPageIndex - 1, 0, layout.pageCount - 1)
      : normalizePageIndex(dragOriginPageIndex - 1, layout.pageCount);
    isSnap = targetIndex === dragOriginPageIndex;
  }

  const targetVirtualIndex = layout.isFinite
    ? getPageStart(targetIndex, layout.clampedVisible)
    : getAlignedVirtualIndex(targetIndex, releasePosition, layout);

  return {
    targetIndex,
    targetVirtualIndex,
    isSnap:
      isSnap ||
      Math.abs(targetVirtualIndex - releasePosition) < dragReleaseEpsilon,
  };
};
