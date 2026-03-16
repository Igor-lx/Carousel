import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "../app/App";
import { ThemeProvider } from "../support/theme_toggle/useThemeSwitcher";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("root not found");
}

const reactRoot = createRoot(rootElement);

reactRoot.render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
