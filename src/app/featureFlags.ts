/**
 * Feature phasing flags (mega-prompt §8). Flip a phased feature on here without
 * touching screens. `p2` gates phase-2 backlog items (e.g. Notes de frais);
 * "Plus tard" items are always visible but route to a "Bientôt disponible" stub.
 */
export const featureFlags = {
  /** Phase-2 backlog. Keep false until phase 2. */
  p2: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
