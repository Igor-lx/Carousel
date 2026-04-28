import { createContext } from "react";
import type { ThemeContextType } from "./types";

export const STORAGE_KEY = "theme-mode";

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
