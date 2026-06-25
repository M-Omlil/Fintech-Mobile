import { palette } from "./palette";
import { durations, elevation, radii, sizing, spacing } from "./tokens";
import { typography } from "./typography";

/**
 * Semantic color contract (Section 2.1). Screens/components reference these names
 * only. A future dark theme supplies a different `colors` map of the same shape —
 * zero component changes (Section 4, Open/Closed + acceptance criteria).
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
};

const lightColors: ThemeColors = {
  background: palette.fogWhite,
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
  border: "rgba(113,134,150,0.20)",
  success: "#1FA971",
  danger: "#E5484D",
  overlay: "rgba(6,26,56,0.45)",
  shadow: palette.midnightNavy,
};

/**
 * Dark theme scaffold — structurally complete so the app compiles and a reviewer
 * can finish it by editing only these tokens. Values are placeholders tuned for a
 * dark surface; refine when dark mode ships.
 */
const darkColors: ThemeColors = {
  background: "#07142B",
  surface: "#0E2143",
  surfaceMuted: "#142A50",
  surfaceAccent: "#1B3A68",
  surfaceDark: "#050E20",
  textPrimary: "#F2F6FB",
  textSecondary: "#93A7BE",
  textOnPrimary: palette.midnightNavy,
  textOnDark: palette.white,
  primary: palette.white,
  accent: palette.oceanBlue,
  border: "rgba(147,167,189,0.16)",
  success: "#3DD68C",
  danger: "#FF6166",
  overlay: "rgba(2,8,18,0.66)",
  shadow: "#000000",
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
  violet: { bg: "rgba(124,108,214,0.12)", fg: "#5E51B5" },
  navy: { bg: "rgba(6,26,56,0.06)", fg: palette.midnightNavy },
} as const;

export type TintName = keyof typeof lightTints;
export type Tints = Record<TintName, Tint>;

/** Dark-mode tints: brighter foregrounds on slightly stronger washes so IconTiles stay
 * legible on a dark surface (the light `navy` fg would vanish otherwise). */
const darkTints: Tints = {
  blue: { bg: "rgba(39,171,252,0.18)", fg: "#5CC0FF" },
  green: { bg: "rgba(61,214,140,0.18)", fg: "#5FE0A4" },
  red: { bg: "rgba(255,97,102,0.18)", fg: "#FF8E92" },
  peach: { bg: "rgba(229,138,72,0.20)", fg: "#F0A968" },
  yellow: { bg: "rgba(229,196,72,0.20)", fg: "#E9CF5E" },
  violet: { bg: "rgba(124,108,214,0.24)", fg: "#AEA1F2" },
  navy: { bg: "rgba(255,255,255,0.08)", fg: "#CBD8E6" },
};

/** Brand gradients (e.g. the card visual). Fixed across schemes. */
const gradients = {
  card: [palette.midnightNavy, palette.navyTint] as const,
} as const;

const shared = {
  spacing,
  radii,
  sizing,
  durations,
  elevation,
  typography,
  gradients,
} as const;

export type Theme = typeof shared & {
  scheme: "light" | "dark";
  colors: ThemeColors;
  tints: Tints;
};

export const lightTheme: Theme = {
  scheme: "light",
  colors: lightColors,
  tints: lightTints,
  ...shared,
};
export const darkTheme: Theme = {
  scheme: "dark",
  colors: darkColors,
  tints: darkTints,
  ...shared,
};
