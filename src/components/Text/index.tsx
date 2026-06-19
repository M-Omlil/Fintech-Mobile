import React from "react";
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";

import { useTheme } from "@theme/index";
import type { ThemeColors } from "@theme/theme";
import type { TypographyVariant } from "@theme/typography";

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  /** Semantic color token; defaults to primary text. */
  color?: keyof ThemeColors;
  style?: TextStyle | TextStyle[];
};

/**
 * Typed typography primitive (Section 2.2 / 7). All text in the app flows through
 * this wrapper — never an inline fontSize/weight.
 */
export function Text({
  variant = "bodyLg",
  color = "textPrimary",
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText style={[theme.typography[variant], { color: theme.colors[color] }, style]} {...rest}>
      {children}
    </RNText>
  );
}
