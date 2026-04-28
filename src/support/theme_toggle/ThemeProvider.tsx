import { useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEY, ThemeContext } from "./ThemeContext";
import {
  type ThemeMode,
  type OnScreenThemeMode,
  ON_SCREEN_MODES,
  THEME_MODES,
  BROWSER_THEME_COLORS,
} from "./types";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? THEME_MODES.AUTO;
  });

  const [onScreenTheme, setOnScreenTheme] = useState<OnScreenThemeMode>(
    ON_SCREEN_MODES.DARK,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      let nextTheme: OnScreenThemeMode;
      if (theme === THEME_MODES.AUTO) {
        nextTheme = mediaQuery.matches
          ? ON_SCREEN_MODES.DARK
          : ON_SCREEN_MODES.LIGHT;
      } else {
        nextTheme = theme as OnScreenThemeMode;
      }

      setOnScreenTheme(nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem(STORAGE_KEY, theme);
    };

    handleChange();

    if (theme === THEME_MODES.AUTO) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const targetColor = BROWSER_THEME_COLORS[onScreenTheme];
    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", targetColor);
  }, [onScreenTheme]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newMode = (e.newValue as ThemeMode) ?? THEME_MODES.AUTO;
        setTheme(newMode);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setTheme(
      onScreenTheme === ON_SCREEN_MODES.LIGHT
        ? THEME_MODES.DARK
        : THEME_MODES.LIGHT,
    );
  };

  return (
    <ThemeContext.Provider
      value={{ theme, onScreenTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
