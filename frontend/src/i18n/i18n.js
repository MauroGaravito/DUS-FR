import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";
import pt from "./pt.json";

const STORAGE_KEY = "dus-fr-ui-lang";
const SUPPORTED_LANGS = new Set(["en", "es", "pt"]);

function resolveInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.has(stored)) {
    return stored;
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt }
  },
  lng: resolveInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
