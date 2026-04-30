import type { NumericMotionValueSource } from "../../../../shared";

export interface CarouselExternalControlHandle {
  moveRight: () => void;
  moveLeft: () => void;
  setDuration: (duration: number | null) => void;
  setStopped?: (isStopped: boolean) => void;
  bindMotionSource?: (source: NumericMotionValueSource | null) => void;
}

export const isCarouselExternalControlHandle = (
  value: unknown,
): value is CarouselExternalControlHandle => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<CarouselExternalControlHandle>;

  return (
    typeof candidate.moveRight === "function" &&
    typeof candidate.moveLeft === "function" &&
    typeof candidate.setDuration === "function"
  );
};

export const canBindCarouselMotionSource = (
  value: CarouselExternalControlHandle | null,
) => typeof value?.bindMotionSource === "function";
