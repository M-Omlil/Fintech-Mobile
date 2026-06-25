import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { makeStyles, useTheme } from "@theme/index";
import type { Spacing } from "@theme/tokens";

export type CardVariant = "surface" | "muted" | "accent" | "dark";

export type CardProps = {
  variant?: CardVariant;
  /** Padding token; defaults to `lg`. Pass `"none"` for edge-to-edge content. */
  padding?: Spacing | "none";
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Surface container (Section 2.3 / 7). The prominent `surface`/`dark` panels are filled
 * with a soft vertical sheen (`gradients.panel*`) that fades toward the neon canvas, so
 * the edge melts into the background instead of reading as a hard slab — no border, no
 * hard shadow. `muted`/`accent` are small inner chips, kept as flat fills.
 */
export function Card({ variant = "surface", padding = "lg", children, style }: CardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const pad = padding === "none" ? 0 : theme.spacing[padding];

  if (variant === "surface" || variant === "dark") {
    const fill = variant === "surface" ? theme.gradients.panel : theme.gradients.panelDark;
    return (
      <View style={[styles.base, styles.clip, { padding: pad }, style]}>
        <LinearGradient
          colors={fill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return <View style={[styles.base, styles[variant], { padding: pad }, style]}>{children}</View>;
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: t.radii.card },
  clip: { overflow: "hidden" },
  muted: { backgroundColor: t.colors.surfaceMuted },
  accent: { backgroundColor: t.colors.surfaceAccent },
}));
