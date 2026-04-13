export interface CarouselExternalController {
  moveRight: () => void;
  moveLeft: () => void;
  toggleFreezed: (isFreezed: boolean) => void;
  setDuration: (val: number | null) => void;
}
