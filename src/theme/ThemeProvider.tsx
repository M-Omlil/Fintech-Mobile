import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";

import { darkTheme, lightTheme, type Theme } from "./theme";

export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "light" | "dark";

const MODE_KEY = "amano.theme.mode";

export const ThemeContext = createContext<Theme>(lightTheme);

type ThemeModeContextValue = {
  /** User preference. */
  mode: ThemeMode;
  /** Resolved scheme actually applied (mode, or the OS scheme when mode === "system"). */
  scheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "light",
  scheme: "light",
  setMode: () => undefined,
});

/** Read/update the app's appearance preference (light · dark · system). */
export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}

function systemScheme(): ColorScheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

/**
 * Single source of theme for the tree. Holds the user's appearance preference (persisted),
 * follows the OS appearance in "system" mode, and re-themes every component on change with
 * no component-level edits (Open/Closed). Palette stays MyLegal across both schemes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [osScheme, setOsScheme] = useState<ColorScheme>(systemScheme);

  // Restore the persisted preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY)
      .then((value) => {
        if (value === "light" || value === "dark" || value === "system") setModeState(value);
      })
      .catch(() => undefined);
  }, []);

  // Track the OS appearance (only matters in "system" mode).
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setOsScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => undefined);
  }, []);

  const scheme: ColorScheme = mode === "system" ? osScheme : mode;
  const theme = useMemo<Theme>(() => (scheme === "dark" ? darkTheme : lightTheme), [scheme]);
  const modeValue = useMemo<ThemeModeContextValue>(
    () => ({ mode, scheme, setMode }),
    [mode, scheme, setMode],
  );

  return (
    <ThemeModeContext.Provider value={modeValue}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeModeContext.Provider>
  );
}
