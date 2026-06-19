import React, { createContext, useMemo } from "react";

import { lightTheme, darkTheme, type Theme } from "./theme";

export const ThemeContext = createContext<Theme>(lightTheme);

type ThemeProviderProps = {
  /** Force a scheme; defaults to light. Dark is scaffolded but not yet shipped. */
  scheme?: "light" | "dark";
  children: React.ReactNode;
};

/**
 * Single source of theme for the tree. Swapping `scheme` (or later, wiring it to the
 * system appearance) re-themes every component with no component-level edits.
 */
export function ThemeProvider({ scheme = "light", children }: ThemeProviderProps) {
  const theme = useMemo<Theme>(() => (scheme === "dark" ? darkTheme : lightTheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
