import React from "react";
import { View, type ViewStyle } from "react-native";

import { makeStyles } from "@theme/index";

export type ProgressBarProps = {
  value: number;
  max: number;
  style?: ViewStyle;
};

/** Track (paleSky) + fill (accent) progress indicator (Section 7 — card limits). */
export function ProgressBar({ value, max, style }: ProgressBarProps) {
  const styles = useStyles();
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      style={[styles.track, style]}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    height: t.spacing.sm,
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.surfaceAccent,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: t.radii.pill,
    backgroundColor: t.colors.accent,
  },
}));
