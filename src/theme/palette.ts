/**
 * Raw Amano brand palette (Section 2.1). These hex values are the single source of
 * truth for brand color and must never be referenced directly by components — they
 * flow into semantic aliases in `theme.ts`, which is what the UI consumes.
 */
export const palette = {
  oceanBlue: "#27ABFC",
  midnightNavy: "#061A38",
  /** Lighter navy used as the card-gradient end stop. */
  navyTint: "#0E3A66",
  steelGray: "#718696",
  fogWhite: "#F3F6F9",
  cloudBlue: "#EBF6FE",
  paleSky: "#D8EFFB",
  white: "#FFFFFF",
} as const;

export type PaletteColor = keyof typeof palette;
