import { createContext, useContext } from "react";

export interface CarouselContextValue {
  pageCount: number;
  activeDotIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  actualSpeed: number;
  isPaginationDynamic: boolean;
  handleDotClick: (idx: number) => void;

}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export const useCarouselContext = () => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("Must be used within CarouselMulti");
  return context;
};
