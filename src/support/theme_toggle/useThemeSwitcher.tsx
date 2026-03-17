import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type ThemeContextType,
  type ThemeMode,
  type OnScreenThemeMode,
  ON_SCREEN_MODES,
  THEME_MODES,
  BROWSER_THEME_COLORS,
} from "./types";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "theme-mode";

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

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

/* 

1. index.html  - блокирующий скрипт в конце <head>
------------------------------------------------------------
<script>
      (function () {
        try {
          var STORAGE_KEY = "theme-mode"; // значение должно быть идентично STORAGE_KEY  в компоненте
          var mode = localStorage.getItem(STORAGE_KEY) || "auto";
          var theme = mode;

          if (mode === "auto") {
            theme = window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
          }

          document.documentElement.setAttribute("data-theme", theme);
        } catch (e) {
          var fallback = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
          document.documentElement.setAttribute("data-theme", fallback);
        }
      })();
    </script>


2. main.tsx - обертка в <ThemeProvider>
------------------------------------------------------------
const reactRoot = createRoot(rootElement);

reactRoot.render(
  <StrictMode>
      <ThemeProvider>
          <App />
      </ThemeProvider>
  </StrictMode>
);


3. index.scss
------------------------------------------------------------
:root {
  --theme-marker: light;

  --color-global: black;
  ...итд
}

[data-theme="dark"] {
  --theme-marker: dark;

  --color-global: white;
  ...итд
}



4. App.tsx 
------------------------------------------------------------
function App() {
  const { theme, onScreenTheme, setTheme, toggleTheme } = useTheme();

  return (
    <main>
  
      <p>Выбранный режим: {theme}</p>  
      <p>Фактический цвет: {onScreenTheme}</p>
  
      <button onClick={() => setTheme(THEME_MODES.LIGHT)} disabled={theme === THEME_MODES.LIGHT}>Светлая</button>
      <button onClick={() => setTheme(THEME_MODES.DARK)} disabled={theme === THEME_MODES.DARK}>Темная</button>
      <button onClick={() => setTheme(THEME_MODES.AUTO)} disabled={theme === THEME_MODES.AUTO}>Авто</button>
      <button onClick={toggleTheme}>Сменить тему</button>
      
    </main>
  );
}



5. Компонент .scss 
--------------------------------------------
.rootContainer {
  --color: var(--color-component, var(--color-global));
  --color-component: orange; // переопределение только для конкретного компонента и только для светлой темы 

  display: flex;
  align-items: center;
  width: 100%;
  итд
}

.element {
color: var(--color);
}

[data-theme="dark"] .rootContainer {
  --color: var(--color-component-DT, var(--color-global));
  --color-component-DT: orange; // переопределение только для конкретного компонента и только для темной темы 
}

*/
