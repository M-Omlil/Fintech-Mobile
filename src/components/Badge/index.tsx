import React from "react";
import { View, type ViewStyle } from "react-native";

import type { TileIcon } from "@components/IconTile";
import { Text } from "@components/Text";
import { makeStyles, useTheme } from "@theme/index";

export type BadgeTone = "accent" | "muted" | "success" | "danger";

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Optional leading line icon (e.g. rocket for "Nouveau", lock for upgrade). */
  icon?: TileIcon;
  style?: ViewStyle;
};

/** Small status pill used for "Nouveau", "Inactive", upgrade locks (Sections 6.5/6.7). */
export function Badge({ label, tone = "accent", icon: Icon, style }: BadgeProps) {
  const theme = useTheme();
  const styles = useStyles();

  const toneColors: Record<BadgeTone, { bg: string; fg: keyof typeof theme.colors }> = {
    accent: { bg: theme.colors.surfaceAccent, fg: "accent" },
    muted: { bg: theme.colors.surfaceMuted, fg: "textSecondary" },
    success: { bg: theme.tints.green.bg, fg: "success" },
    danger: { bg: "rgba(229,72,77,0.12)", fg: "danger" },
  };
  const current = toneColors[tone];

  return (
    <View style={[styles.badge, { backgroundColor: current.bg }, style]}>
      {Icon ? <Icon size={12} color={theme.colors[current.fg]} strokeWidth={2} /> : null}
      <Text variant="caption" color={current.fg}>
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: 2,
    borderRadius: t.radii.chip,
  },
}));
