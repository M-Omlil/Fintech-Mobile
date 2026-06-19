import "i18next";

import type { FrResources } from "./locales/fr";

/** Typed translation keys — `t("home.balanceTitle")` is checked at compile time. */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: FrResources };
  }
}
