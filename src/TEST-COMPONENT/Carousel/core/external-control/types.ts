export interface CarouselExternalControlHandle {
  moveRight: () => void;
  moveLeft: () => void;
  setDuration: (val: number | null) => void;
}
