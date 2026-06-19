import { useContext } from "react";

import type { Theme } from "./theme";
import { ThemeContext } from "./ThemeProvider";

/** Read the active theme. The primary hook every component uses for styling. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
