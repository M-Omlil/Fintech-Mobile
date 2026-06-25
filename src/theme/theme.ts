import { palette } from "./palette";
import { durations, elevation, radii, sizing, spacing } from "./tokens";
import { typography } from "./typography";

/**
 * Semantic color contract (Section 2.1). Screens/components reference these names
 * only. The dark theme supplies a different `colors` map of the same shape — zero
 * component changes (Section 4, Open/Closed + acceptance criteria).
 */
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceAccent: string;
  surfaceDark: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  textOnDark: string;
  primary: string;
  accent: string;
  border: string;
  success: string;
  danger: string;
  overlay: string;
  /** Drives the soft-shadow system in `tokens.elevation`. */
  shadow: string;
  /** Vivid neon halo color fed to `elevation.glow` (`shadowColor`). */
  glow: string;
  /** Luminous hairline edge on cards/controls — the "neon glass" rim. */
  cardBorder: string;
};

const lightColors: ThemeColors = {
  background: "#EEF2FE",
  surface: palette.white,
  surfaceMuted: palette.cloudBlue,
  surfaceAccent: palette.paleSky,
  surfaceDark: palette.midnightNavy,
  textPrimary: palette.midnightNavy,
  textSecondary: palette.steelGray,
  textOnPrimary: palette.white,
  textOnDark: palette.white,
  primary: palette.midnightNavy,
  accent: palette.oceanBlue,
  border: "rgba(110,86,247,0.16)",
  success: "#1FA971",
  danger: "#E5484D",
  overlay: "rgba(6,26,56,0.45)",
  shadow: palette.midnightNavy,
  glow: palette.oceanBlue,
  cardBorder: "rgba(39,171,252,0.12)",
};

/**
 * Neon dark theme — translucent "glass" surfaces over the indigo canvas gradient,
 * luminous edges, and an ocean-blue glow. Surfaces are intentionally semi-transparent
 * so the canvas reads through them (the frosted look of the inspiration).
 */
const darkColors: ThemeColors = {
  background: palette.deepIndigo,
  surface: "rgba(255,255,255,0.07)",
  surfaceMuted: "rgba(255,255,255,0.05)",
  surfaceAccent: "rgba(110,86,247,0.20)",
  surfaceDark: "rgba(4,6,24,0.40)",
  textPrimary: "#F3F5FF",
  textSecondary: "#A7AED6",
  textOnPrimary: palette.white,
  textOnDark: palette.white,
  primary: palette.violet,
  accent: palette.oceanBlue,
  border: "rgba(255,255,255,0.10)",
  success: "#3DD68C",
  danger: "#FF6166",
  overlay: "rgba(6,4,24,0.66)",
  shadow: "#000000",
  glow: palette.oceanBlue,
  cardBorder: "rgba(255,255,255,0.10)",
};

/**
 * Subtle surface tints for IconTiles (Section 6.5 — one per Menu group). Each tint
 * pairs a soft background with a readable foreground. Kept low-saturation to stay
 * within the calm Amano range; a dark theme can override this map later.
 */
export type Tint = { bg: string; fg: string };
const lightTints = {
  blue: { bg: "rgba(39,171,252,0.12)", fg: "#1689D4" },
  green: { bg: "rgba(31,169,113,0.12)", fg: "#188A5D" },
  red: { bg: "rgba(229,72,77,0.12)", fg: "#D23B40" },
  peach: { bg: "rgba(229,138,72,0.14)", fg: "#C9701F" },
  yellow: { bg: "rgba(229,196,72,0.16)", fg: "#A8842A" },
  violet: { bg: "rgba(110,86,247,0.14)", fg: "#5E51B5" },
  navy: { bg: "rgba(6,26,56,0.06)", fg: palette.midnightNavy },
} as const;

export type TintName = keyof typeof lightTints;
export type Tints = Record<TintName, Tint>;

/** Dark-mode tints: brighter foregrounds on stronger glassy washes so IconTiles stay
 * legible and luminous against the translucent dark surfaces. */
const darkTints: Tints = {
  blue: { bg: "rgba(39,171,252,0.22)", fg: "#6CC7FF" },
  green: { bg: "rgba(61,214,140,0.20)", fg: "#5FE0A4" },
  red: { bg: "rgba(255,97,102,0.20)", fg: "#FF8E92" },
  peach: { bg: "rgba(229,138,72,0.22)", fg: "#F0A968" },
  yellow: { bg: "rgba(229,196,72,0.22)", fg: "#E9CF5E" },
  violet: { bg: "rgba(110,86,247,0.30)", fg: "#B3A4FF" },
  navy: { bg: "rgba(255,255,255,0.08)", fg: "#CBD8E6" },
};

/**
 * Theme gradients. `appCanvas` is the full-screen neon backdrop (rendered once, behind
 * navigation); `card` is the brand card visual. Both differ per scheme so the neon
 * read stays luminous on light and dark.
 */
export type Gradients = {
  appCanvas: readonly [string, string, string];
  card: readonly [string, string];
};

const lightGradients: Gradients = {
  appCanvas: ["#EEF2FE", "#F4F7FB", "#E7F1FF"],
  card: [palette.violet, palette.oceanBlue],
};

const darkGradients: Gradients = {
  appCanvas: [palette.deepIndigo, palette.nightIndigo, palette.royalIndigo],
  card: ["#3A2EA8", palette.oceanBlue],
};

const shared = {
  spacing,
  radii,
  sizing,
  durations,
  elevation,
  typography,
} as const;

export type Theme = typeof shared & {
  scheme: "light" | "dark";
  colors: ThemeColors;
  tints: Tints;
  gradients: Gradients;
};

export const lightTheme: Theme = {
  scheme: "light",
  colors: lightColors,
  tints: lightTints,
  gradients: lightGradients,
  ...shared,
};
export const darkTheme: Theme = {
  scheme: "dark",
  colors: darkColors,
  tints: darkTints,
  gradients: darkGradients,
  ...shared,
};
