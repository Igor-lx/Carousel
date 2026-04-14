import { createContext, useContext } from "react";
import type { CarouselContextValue } from "./types";

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export const useCarouselContext = () => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("Must be used within Carousel");
  return context;
};
