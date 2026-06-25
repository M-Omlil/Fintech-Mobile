import React from "react";
import { View, type ViewStyle } from "react-native";

import { makeStyles, useTheme } from "@theme/index";
import type { Spacing } from "@theme/tokens";

export type CardVariant = "surface" | "muted" | "accent" | "dark";

export type CardProps = {
  variant?: CardVariant;
  /** Padding token; defaults to `lg`. Pass `"none"` for edge-to-edge content. */
  padding?: Spacing | "none";
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Surface container (Section 2.3 / 7). The soft-shadow system is the app-wide choice
 * over hairline borders; only `surface`/`dark` cast a shadow.
 */
export function Card({ variant = "surface", padding = "lg", children, style }: CardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const pad = padding === "none" ? 0 : theme.spacing[padding];
  return <View style={[styles.base, styles[variant], { padding: pad }, style]}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  // No outline — a hard 1px line always reads as a boxy edge. Cards are defined by a
  // slightly-lighter translucent fill + a soft shadow (true "soft glass"). The neon
  // glow is reserved for hero/interactive elements (Button, tab bar).
  base: {
    borderRadius: t.radii.card,
  },
  surface: {
    backgroundColor: t.colors.surface,
    shadowColor: t.colors.shadow,
    ...t.elevation.card,
  },
  muted: { backgroundColor: t.colors.surfaceMuted },
  accent: { backgroundColor: t.colors.surfaceAccent },
  dark: {
    backgroundColor: t.colors.surfaceDark,
    shadowColor: t.colors.shadow,
    ...t.elevation.card,
  },
}));
