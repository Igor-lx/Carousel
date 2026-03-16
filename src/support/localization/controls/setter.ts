import i18n from "../hooks/i18next";
import type { LangMode } from "../setup";

export const setLanguage = (lang: LangMode) => {
  i18n.changeLanguage(lang);
};
