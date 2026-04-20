export interface CarouselExternalController {
  moveRight: () => void;
  moveLeft: () => void;
  setDuration: (val: number | null) => void;
}
