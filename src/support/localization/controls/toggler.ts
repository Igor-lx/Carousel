import i18n from "../hooks/i18next";
import { LANG_MODES, type LangMode } from "../setup";

const LANGUAGES = Object.values(LANG_MODES);

export const toggleLanguage = () => {
  const currentLang = i18n.language as LangMode;
  const currentIndex = LANGUAGES.indexOf(currentLang);
  const nextIndex = (currentIndex + 1) % LANGUAGES.length;

  i18n.changeLanguage(LANGUAGES[nextIndex]);
};
