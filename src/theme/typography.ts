import type { TextStyle } from "react-native";

/**
 * Inter type system (Section 2.2). Family names match the @expo-google-fonts/inter
 * exports loaded at bootstrap. Components must select a `variant`, never an inline
 * fontSize/weight.
 */
export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

/** The full set of font assets to preload (must mirror `fontFamily`). */
export const interFontMap = {
  Inter_400Regular: undefined,
  Inter_500Medium: undefined,
  Inter_600SemiBold: undefined,
  Inter_700Bold: undefined,
} as const;

export type TypographyVariant =
  | "displayLg"
  | "titleXl"
  | "titleLg"
  | "titleMd"
  | "bodyLg"
  | "bodyMd"
  | "label"
  | "caption"
  | "numericLg";

/** Enable tabular figures for amount/numeric displays (Section 2.2). */
const tabular: Pick<TextStyle, "fontVariant"> = { fontVariant: ["tabular-nums"] };

/**
 * Compact, refined scale. Pro finance apps read as elegant largely because their type
 * is a touch smaller and tracked tighter at the top end — so headings/numerics carry
 * subtle negative letter-spacing while body text stays comfortably legible. Retuning
 * happens here only; components keep selecting variants by name.
 */
export const typography: Record<TypographyVariant, TextStyle> = {
  displayLg: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  titleXl: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  titleLg: { fontFamily: fontFamily.semiBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 },
  titleMd: { fontFamily: fontFamily.semiBold, fontSize: 15, lineHeight: 21, letterSpacing: -0.2 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodyMd: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  caption: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 15, letterSpacing: 0.1 },
  numericLg: {
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    ...tabular,
  },
};
