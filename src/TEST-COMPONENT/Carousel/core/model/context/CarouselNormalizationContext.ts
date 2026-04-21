import { createContext, useContext } from "react";
import type { CarouselNormalizationContextValue } from "./types";

export const CarouselNormalizationContext =
  createContext<CarouselNormalizationContextValue | null>(null);

export const useCarouselNormalizationContext = () => {
  const context = useContext(CarouselNormalizationContext);

  if (!context) {
    throw new Error("Must be used within Carousel normalization slot");
  }

  return context;
};
