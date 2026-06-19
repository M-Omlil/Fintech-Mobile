import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { fr } from "./locales/fr";

/**
 * i18n bootstrap (Section 1). French is the only locale for now; the structure
 * supports adding others without touching components. Import this module once at app
 * startup (before rendering) for its side effect.
 */
i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: "fr",
  fallbackLng: "fr",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
