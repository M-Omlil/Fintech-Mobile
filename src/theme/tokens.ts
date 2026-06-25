/**
 * Non-color design tokens (Section 2.3). Components consume these names only —
 * no raw numbers for spacing, radius, control sizing, or motion.
 */

/** 8pt spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radii per surface/control type. */
export const radii = {
  card: 16,
  sheet: 24,
  pill: 999,
  control: 12,
  chip: 10,
} as const;

/** Fixed control sizing so touch targets and rhythm stay consistent. */
export const sizing = {
  /** Primary/secondary button height (Section 2.3). */
  buttonHeight: 56,
  /** Minimum accessible touch target (Section 3 — a11y). */
  minTouchTarget: 44,
  /** Default IconTile square. */
  iconTile: 44,
  /** Circular action button (e.g. Bloquer / PIN on Cards). */
  actionButton: 52,
  /** Floating pill tab bar height (Section 6.1). */
  tabBarHeight: 64,
  /** Vertical space a screen reserves so content clears the floating tab bar. */
  tabBarClearance: 96,
  /** Hairline border width. */
  hairline: 1,
} as const;

/** Animation durations (ms). */
export const durations = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

/**
 * Soft shadow system (Section 2.3 — chosen over hairline borders app-wide for
 * cards/sheets). Spread into a style; `shadowColor` is supplied by the theme so a
 * future dark theme can darken it.
 */
export const elevation = {
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  sheet: {
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  tabBar: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  /**
   * Neon glow — a centered colored halo (no offset). Spread it and supply a vivid
   * `shadowColor` (the theme's `glow`) to make a control or hero card luminesce.
   */
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radii;
