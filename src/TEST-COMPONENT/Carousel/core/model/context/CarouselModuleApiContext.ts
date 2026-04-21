import { createContext, useContext } from "react";
import type { CarouselModuleApi } from "./types";

export const CarouselModuleApiContext =
  createContext<CarouselModuleApi | null>(null);

export const useCarouselModuleApi = () => {
  const context = useContext(CarouselModuleApiContext);

  if (!context) {
    throw new Error("Must be used within Carousel module API context");
  }

  return context;
};
