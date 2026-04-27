import { createContext, useContext } from "react";

import type { CarouselModuleContextValue } from "./types";

export const CarouselModuleContext =
  createContext<CarouselModuleContextValue | null>(null);

export const useCarouselModuleContext = () => {
  const context = useContext(CarouselModuleContext);

  if (!context) {
    throw new Error("Must be used within Carousel module context");
  }

  return context;
};
