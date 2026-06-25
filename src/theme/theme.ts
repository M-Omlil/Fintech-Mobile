import { palette } from "./palette";
import { durations, elevation, radii, sizing, spacing } from "./tokens";
import { typography } from "./typography";

/**
 * Semantic color contract (Section 2.1). Every value derives from the MyLegal brand
 * identity palette (Ocean Blue, Steel Gray, Fog White, Cloud Blue, Pale Sky, Midnight
 * Navy). Screens/components reference these semantic names only; the dark theme supplies
 * a different `colors` map of the same shape — zero component changes (Open/Closed).
 */
export type ThemeColors = {
  background: string;
  surface: string;
  /** Opaque surface for modals/sheets that float over the app (must fully hide the
   * content behind them — translucent `surface` would let it bleed through). */
  surfaceSolid: string;
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
  /** Brand glow color fed to `elevation.glow` (`shadowColor`) — Ocean Blue. */
  glow: string;
  /** Luminous hairline edge available to cards/controls. */
  cardBorder: string;
};

const lightColors: ThemeColors = {
  background: palette.fogWhite,
  surface: palette.white,
  surfaceSolid: palette.white,
  surfaceMuted: palette.cloudBlue,
  surfaceAccent: palette.paleSky,
  surfaceDark: palette.midnightNavy,
  textPrimary: palette.midnightNavy,
  textSecondary: palette.steelGray,
  textOnPrimary: palette.white,
  textOnDark: palette.white,
  primary: palette.midnightNavy,
  accent: palette.oceanBlue,
  border: "rgba(113,134,150,0.20)", // Steel Gray
  success: "#1FA971",
  danger: "#E5484D",
  overlay: "rgba(6,26,56,0.45)", // Midnight Navy scrim
  shadow: palette.midnightNavy,
  glow: palette.oceanBlue,
  cardBorder: "rgba(39,171,252,0.12)", // Ocean Blue
};

/**
 * Dark theme — a solid Midnight Navy (#061A38) canvas with translucent surfaces layered
 * over it and Ocean Blue accents. Lighter navies and the cool grays are tints derived
 * from the brand Midnight Navy / Steel Gray, so the whole scheme stays on the identity.
 */
const darkColors: ThemeColors = {
  background: palette.midnightNavy,
  surface: "rgba(255,255,255,0.09)",
  surfaceSolid: "#0B2A50", // tint of Midnight Navy (opaque sheets)
  surfaceMuted: "rgba(255,255,255,0.06)",
  surfaceAccent: "rgba(39,171,252,0.16)", // Ocean Blue wash
  surfaceDark: "rgba(2,10,24,0.45)",
  textPrimary: "#EAF1F8",
  textSecondary: "#90A4B8", // Steel Gray, lightened for dark surfaces
  textOnPrimary: palette.white,
  textOnDark: palette.white,
  primary: palette.oceanBlue,
  accent: palette.oceanBlue,
  border: "rgba(255,255,255,0.10)",
  success: "#3DD68C",
  danger: "#FF6166",
  overlay: "rgba(3,12,28,0.66)",
  shadow: "#000000",
  glow: palette.oceanBlue,
  cardBorder: "rgba(255,255,255,0.10)",
};

/**
 * Subtle surface tints for IconTiles (Section 6.5 — one per Menu group). Each tint pairs
 * a soft background with a readable foreground. Low-saturation to stay within the brand
 * range; the `violet` slot is a brand Steel Gray (no purple in the identity).
 */
export type Tint = { bg: string; fg: string };
const lightTints = {
  blue: { bg: "rgba(39,171,252,0.12)", fg: "#1689D4" },
  green: { bg: "rgba(31,169,113,0.12)", fg: "#188A5D" },
  red: { bg: "rgba(229,72,77,0.12)", fg: "#D23B40" },
  peach: { bg: "rgba(229,138,72,0.14)", fg: "#C9701F" },
  yellow: { bg: "rgba(229,196,72,0.16)", fg: "#A8842A" },
  violet: { bg: "rgba(113,134,150,0.16)", fg: "#566977" }, // Steel Gray
  navy: { bg: "rgba(6,26,56,0.06)", fg: palette.midnightNavy },
} as const;

export type TintName = keyof typeof lightTints;
export type Tints = Record<TintName, Tint>;

/** Dark-mode tints: brighter foregrounds on stronger washes so IconTiles stay legible
 * against the translucent dark surfaces. */
const darkTints: Tints = {
  blue: { bg: "rgba(39,171,252,0.22)", fg: "#6CC7FF" },
  green: { bg: "rgba(61,214,140,0.20)", fg: "#5FE0A4" },
  red: { bg: "rgba(255,97,102,0.20)", fg: "#FF8E92" },
  peach: { bg: "rgba(229,138,72,0.22)", fg: "#F0A968" },
  yellow: { bg: "rgba(229,196,72,0.22)", fg: "#E9CF5E" },
  violet: { bg: "rgba(113,134,150,0.26)", fg: "#AEBECC" }, // Steel Gray
  navy: { bg: "rgba(255,255,255,0.08)", fg: "#CBD8E6" },
};

/**
 * Theme gradients. `appCanvas` is the full-screen backdrop (a solid Midnight Navy in dark
 * per brand; a soft Fog→Cloud→Pale wash in light). `card` is the brand card visual;
 * `panel`/`panelDark` are soft sheens for the prominent card surfaces.
 */
export type Gradients = {
  appCanvas: readonly [string, string, string];
  card: readonly [string, string];
  panel: readonly [string, string];
  panelDark: readonly [string, string];
};

const lightGradients: Gradients = {
  appCanvas: [palette.fogWhite, palette.cloudBlue, "#DCEFFB"],
  card: [palette.midnightNavy, palette.oceanBlue],
  panel: ["rgba(255,255,255,0.97)", "rgba(255,255,255,0.80)"],
  panelDark: ["rgba(6,26,56,0.55)", "rgba(4,16,34,0.42)"],
};

const darkGradients: Gradients = {
  // Solid Midnight Navy — no gradient in dark mode (brand requirement).
  appCanvas: [palette.midnightNavy, palette.midnightNavy, palette.midnightNavy],
  card: ["#0B2A50", palette.oceanBlue],
  panel: ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.025)"],
  panelDark: ["rgba(8,30,58,0.55)", "rgba(3,12,28,0.40)"],
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
