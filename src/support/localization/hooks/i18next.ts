import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANG, NAMESPACES, resources } from "../setup";

export const DEFAULT_NAMESPACE = "app";

i18n.use(initReactI18next).init({
  ns: NAMESPACES,
  defaultNS: DEFAULT_NAMESPACE,

  resources,
  lng: DEFAULT_LANG,
  fallbackLng: "ru",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
