import type { CarouselRepeatedClickSettings } from "../../diagnostic";
import {
  clamp,
  getPageStart,
  normalizePageIndex,
  type CarouselLayout,
} from "../../../utilities";
import type { State } from "../types";

const clampRepeatedClickVirtualIndex = (
  virtualIndex: number,
  layout: CarouselLayout,
) => {
  if (!layout.isFinite) {
    return virtualIndex;
  }

  const minVirtualIndex = 0;
  const maxVirtualIndex = getPageStart(
    layout.pageCount - 1,
    layout.clampedVisible,
  );

  return clamp(virtualIndex, minVirtualIndex, maxVirtualIndex);
};

export const resolveRepeatedClickPlan = ({
  state,
  fromVirtualIndex,
  step,
  repeatedClickSettings,
}: {
  state: State;
  fromVirtualIndex: number;
  step: number;
  repeatedClickSettings: CarouselRepeatedClickSettings;
}) => {
  const { currentLayout: layout } = state;
  const direction = Math.sign(step);
  const stepSize = layout.clampedVisible;
  const epsilon = repeatedClickSettings.epsilon;

  if (direction === 0 || stepSize <= epsilon) {
    return null;
  }

  const currentDirection = Math.sign(state.virtualIndex - state.fromVirtualIndex);
  const isRepeatedSameDirectionClick =
    state.animMode !== "none" &&
    currentDirection !== 0 &&
    currentDirection === direction;

  if (!isRepeatedSameDirectionClick) {
    return null;
  }

  const { destinationPosition } = repeatedClickSettings;
  const currentPageOrigin =
    direction > 0
      ? Math.floor(fromVirtualIndex / stepSize) * stepSize
      : Math.ceil(fromVirtualIndex / stepSize) * stepSize;

  const nextAdvanceVirtualIndex = clampRepeatedClickVirtualIndex(
    currentPageOrigin + direction * (1 + destinationPosition) * stepSize,
    layout,
  );

  const nextTargetVirtualIndex = clampRepeatedClickVirtualIndex(
    currentPageOrigin + direction * 2 * stepSize,
    layout,
  );

  const targetPageIndex = Math.round(nextTargetVirtualIndex / stepSize);
  const nextTargetIndex = layout.isFinite
    ? clamp(targetPageIndex, 0, layout.pageCount - 1)
    : normalizePageIndex(targetPageIndex, layout.pageCount);
  const followUpVirtualIndex =
    Math.abs(nextTargetVirtualIndex - nextAdvanceVirtualIndex) >= epsilon
      ? nextTargetVirtualIndex
      : null;

  return {
    nextTargetIndex,
    nextAdvanceVirtualIndex,
    followUpVirtualIndex,
  };
};
