export interface CarouselExternalControlHandle {
  moveRight: () => void;
  moveLeft: () => void;
  setDuration: (duration: number | null) => void;
}
