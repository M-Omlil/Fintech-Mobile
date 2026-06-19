import { useMemo } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";

import type { Theme } from "./theme";
import { useTheme } from "./useTheme";

type NamedStyles<T> = { [K in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Theme-aware StyleSheet factory (Section 4 — theming infra). Define styles as a
 * function of the theme; the returned hook memoizes the compiled StyleSheet per
 * theme instance, so re-theming is a single context change with no component edits.
 *
 *   const useStyles = makeStyles((t) => ({ root: { backgroundColor: t.colors.surface } }));
 *   const styles = useStyles();
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
