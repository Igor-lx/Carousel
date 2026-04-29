export interface CarouselExternalControlHandle {
  moveRight: () => void;
  moveLeft: () => void;
  setDuration: (duration: number | null) => void;
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
