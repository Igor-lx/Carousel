import { createContext, useContext } from "react";
import type { CarouselDiagnosticContextValue } from "./types";

export const CarouselDiagnosticContext =
  createContext<CarouselDiagnosticContextValue | null>(null);

export const useCarouselDiagnosticContext = () => {
  const context = useContext(CarouselDiagnosticContext);

  if (!context) {
    throw new Error("Must be used within Carousel diagnostic slot");
  }

  return context;
};
